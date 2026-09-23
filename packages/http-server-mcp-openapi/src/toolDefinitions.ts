import type { JsonObjectSchema } from '@ttoss/http-server-mcp';

import {
  argNameMapper,
  collectServerManagedParameters,
  extractPathParams,
  extractQueryParams,
  snakeToCamel,
  type ToArgName,
} from './parameters';
import {
  buildBodyFn,
  buildPathFn,
  buildQueryFn,
  dereferenceSchema,
  resolveSchema,
} from './schema';
import {
  normalizeNullable,
  pinnedArgs,
  readServerManaged,
  type ServerManagedExtension,
  withPinned,
} from './serverManaged';
import {
  DEFAULT_EXCLUDE_EXTENSION,
  DEFAULT_SERVER_MANAGED_EXTENSION,
  type JsonSchemaProperty,
  type OpenApiDocuments,
  type OpenApiSpec,
  type OpenApiToToolsOptions,
  type OperationSpec,
  type RequestBodySpec,
  type ResolvedToolOptions,
  type ToolDefinition,
} from './types';

/** Converts a camelCase `operationId` to a kebab-case tool name. */
export const operationIdToToolName = (operationId: string): string => {
  return operationId
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '');
};

export const getJsonSchemaType = (
  schemaType: string | undefined
): JsonSchemaProperty['type'] => {
  if (schemaType === 'integer' || schemaType === 'number') return 'number';
  if (schemaType === 'boolean') return 'boolean';
  if (schemaType === 'array') return 'array';
  if (schemaType === 'object') return 'object';
  return 'string';
};

const sanitizeDescription = (description: string | undefined): string => {
  return (description || '').replace(/'/g, "\\'").replace(/\n/g, ' ').trim();
};

/**
 * Forwards a property's `oneOf` / `anyOf` / multi-entry `allOf` verbatim, or
 * returns `undefined` when it declares none.
 */
const buildComposedProperty = (param: {
  description: string;
  oneOf?: unknown[];
  anyOf?: unknown[];
  allOf?: unknown[];
}): JsonSchemaProperty | undefined => {
  const { description } = param;
  // A property with `oneOf`/`anyOf` (e.g. a string-or-object union) is
  // forwarded verbatim rather than collapsed to a single guessed primitive —
  // collapsing would reject every alternative shape except whichever one the
  // collapse happened to guess.
  if (param.oneOf && param.oneOf.length > 0) {
    return { oneOf: param.oneOf, description };
  }
  if (param.anyOf && param.anyOf.length > 0) {
    return { anyOf: param.anyOf, description };
  }
  // A multi-entry `allOf` has no single type to collapse to; forwarding it
  // keeps every constraint the REST API enforces.
  if (param.allOf && param.allOf.length > 0) {
    return { allOf: param.allOf, description };
  }
  return undefined;
};

/**
 * Builds a single body/query property's `JsonSchemaProperty`. Split out of
 * {@link buildInputSchema} to keep that function's size and branching down.
 */
const buildTypedProperty = (param: {
  type?: string;
  description: string;
  items?: unknown;
  nullable?: boolean;
  oneOf?: unknown[];
  anyOf?: unknown[];
  allOf?: unknown[];
}): JsonSchemaProperty => {
  const description = sanitizeDescription(param.description);

  const composed = buildComposedProperty({ ...param, description });
  if (composed) return composed;
  // No declared type (e.g. a bare `{}` schema or an unresolvable `$ref`):
  // advertise an untyped schema rather than guessing `string`, which would
  // make every non-string value the API accepts impossible to send.
  if (param.type === undefined) {
    return { description };
  }

  const jsonType = getJsonSchemaType(param.type);
  // OpenAPI `nullable: true` has no direct JSON Schema draft-07 equivalent;
  // representing it as a two-entry `type` array (accepted by the 2020-12
  // dialect the MCP SDK validates against) lets a property stay its declared
  // type while still accepting an explicit `null` — the OpenAPI-documented
  // way to clear a field.
  const finalType =
    param.nullable === true ? [jsonType, 'null' as const] : jsonType;

  if (param.type === 'array') {
    const itemsSchema = param.items ? param.items : { type: 'string' as const };
    return { type: finalType, items: itemsSchema, description };
  }

  return { type: finalType, description };
};

export const buildInputSchema = (
  pathParams: Array<{ name: string; argName: string; serverManaged?: boolean }>,
  queryParams: Array<{
    name: string;
    argName: string;
    description: string;
    required: boolean;
    type: string;
    serverManaged?: boolean;
  }>,
  bodyProps: Array<{
    snakeName: string;
    argName: string;
    description: string;
    required: boolean;
    type?: string;
    items?: unknown;
    nullable?: boolean;
    oneOf?: unknown[];
    anyOf?: unknown[];
    allOf?: unknown[];
  }>
): JsonObjectSchema => {
  // Server-managed parameters are filled by the consumer, never by the model.
  const modelPathParams = pathParams.filter((p) => {
    return !p.serverManaged;
  });
  const modelQueryParams = queryParams.filter((p) => {
    return !p.serverManaged;
  });
  const allParams = [...modelPathParams, ...modelQueryParams, ...bodyProps];

  if (allParams.length === 0) {
    return {
      type: 'object',
    };
  }

  const requiredFields = [
    ...modelPathParams.map((p) => {
      return p.argName;
    }),
    ...modelQueryParams
      .filter((p) => {
        return p.required;
      })
      .map((p) => {
        return p.argName;
      }),
    ...bodyProps
      .filter((p) => {
        return p.required;
      })
      .map((p) => {
        return p.argName;
      }),
  ];

  const properties: Record<string, JsonSchemaProperty> = {};
  for (const param of allParams) {
    properties[param.argName] =
      'description' in param
        ? (normalizeNullable(buildTypedProperty(param)) as JsonSchemaProperty)
        : { type: 'string', description: '' }; // path param
  }

  // `required` is omitted rather than set to `undefined`: JSON has no
  // `undefined`, so the key was never visible to clients anyway, and leaving an
  // explicit `undefined` on the in-memory schema only risks tripping the
  // validator that compiles it when the tool is registered.
  return {
    type: 'object',
    properties,
    ...(requiredFields.length > 0 ? { required: requiredFields } : {}),
  };
};

const resolveBodySchema = (args: {
  requestBody?: RequestBodySpec;
  spec: OpenApiSpec;
  documents?: OpenApiDocuments;
}) => {
  const rawBodySchema = args.requestBody?.content?.['application/json']?.schema;
  const dereferencedBodySchema = dereferenceSchema(
    rawBodySchema,
    args.spec,
    args.documents
  );
  return resolveSchema(dereferencedBodySchema, args.spec, args.documents);
};

/**
 * snake_case names of every top-level property an operation's request schema
 * declares, including server-managed ones.
 */
export const extractAcceptedBodyFields = (args: {
  requestBody?: RequestBodySpec;
  spec: OpenApiSpec;
  documents?: OpenApiDocuments;
}): string[] => {
  const bodySchema = resolveBodySchema(args);
  return Object.keys(bodySchema?.properties ?? {});
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

/**
 * Folds a single-entry `allOf` into the property that wraps it. OpenAPI
 * declares `allOf: [{ $ref }]` so a property can carry its own `description`
 * next to a referenced schema; without folding, the referenced `type`,
 * `nullable` and `items` would be lost. Keys on the wrapper win over the
 * referenced schema's. Multi-entry `allOf` is left intact.
 */
const flattenSingleAllOf = (
  schema: Record<string, unknown>
): Record<string, unknown> => {
  const { allOf, ...rest } = schema;
  if (!Array.isArray(allOf) || allOf.length !== 1) return schema;
  const [entry] = allOf;
  if (!isPlainObject(entry)) return rest;
  return { ...flattenSingleAllOf(entry), ...rest };
};

export const extractBodyProps = (args: {
  requestBody?: RequestBodySpec;
  spec: OpenApiSpec;
  serverManagedExtension: ServerManagedExtension;
  documents?: OpenApiDocuments;
  /** Maps a spec name to its tool argument name. @default snakeToCamel */
  toArgName?: ToArgName;
}): Array<{
  snakeName: string;
  argName: string;
  description: string;
  required: boolean;
  type?: string;
  items?: unknown;
  nullable: boolean;
  oneOf?: unknown[];
  anyOf?: unknown[];
  allOf?: unknown[];
}> => {
  const toArgName = args.toArgName ?? snakeToCamel;
  const bodySchema = resolveBodySchema(args);
  if (!bodySchema?.properties) return [];
  const entries = Object.entries(bodySchema.properties).filter(
    ([, value]: [string, unknown]) => {
      const val = value as Record<string, unknown>;
      return !readServerManaged({
        node: val,
        extension: args.serverManagedExtension,
      }).managed;
    }
  );
  return entries.map(([key, value]: [string, unknown]) => {
    const val = flattenSingleAllOf(value as Record<string, unknown>) as {
      description?: unknown;
      type?: unknown;
      items?: unknown;
      nullable?: unknown;
      oneOf?: unknown;
      anyOf?: unknown;
      allOf?: unknown;
    };
    return {
      snakeName: key,
      argName: toArgName(key),
      description: typeof val.description === 'string' ? val.description : '',
      required: (bodySchema.required || []).includes(key),
      type: typeof val.type === 'string' ? val.type : undefined,
      items: val.items,
      nullable: val.nullable === true,
      oneOf: Array.isArray(val.oneOf) ? val.oneOf : undefined,
      anyOf: Array.isArray(val.anyOf) ? val.anyOf : undefined,
      allOf: Array.isArray(val.allOf) ? val.allOf : undefined,
    };
  });
};

/** Collects every `x-` prefixed extension declared on the operation. */
const extractExtensions = (
  operation: OperationSpec
): Record<string, unknown> => {
  const extensions: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(operation)) {
    if (key.startsWith('x-')) {
      extensions[key] = value;
    }
  }
  return extensions;
};

export const processOperation = (args: {
  pathTemplate: string;
  method: string;
  operation: OperationSpec;
  spec: OpenApiSpec;
  options: ResolvedToolOptions;
  /**
   * Parameters declared at the path-item level (shared by every operation on
   * the path). Merged ahead of the operation's own parameters so operation-level
   * entries win on a `name`+`in` clash.
   */
  pathItemParameters?: Array<{
    name?: string;
    in?: string;
    [key: string]: unknown;
  }>;
}): ToolDefinition | null => {
  const httpMethod = args.method.toUpperCase();
  if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(httpMethod)) {
    return null;
  }

  if (!args.operation.operationId) return null;

  if (args.operation[args.options.excludeExtension]) {
    return null;
  }

  const toolName = operationIdToToolName(args.operation.operationId);

  // OpenAPI applies path-item-level parameters to every operation on the path;
  // operation-level parameters override them on a matching name+in.
  const parameters = [
    ...(args.pathItemParameters ?? []),
    ...(args.operation.parameters ?? []),
  ];

  const { documents, serverManagedExtension } = args.options;
  const toArgName = argNameMapper(args.options.argumentNames);

  const pathParams = extractPathParams({
    parameters,
    spec: args.spec,
    documents,
    toArgName,
    serverManagedExtension,
  });

  const queryParams = extractQueryParams({
    parameters,
    spec: args.spec,
    documents,
    toArgName,
    serverManagedExtension,
  });

  const bodyProps = extractBodyProps({
    requestBody: args.operation.requestBody,
    spec: args.spec,
    serverManagedExtension,
    documents,
    toArgName,
  });

  const inputSchema = buildInputSchema(pathParams, queryParams, bodyProps);

  const serverManagedParameters = collectServerManagedParameters({
    pathParams,
    queryParams,
  });
  const pinned = pinnedArgs(serverManagedParameters);

  const acceptedBodyFields = extractAcceptedBodyFields({
    requestBody: args.operation.requestBody,
    spec: args.spec,
    documents,
  });

  return {
    name: toolName,
    description: sanitizeDescription(args.operation.description),
    inputSchema,
    method: httpMethod,
    pathTemplate: args.pathTemplate,
    operationId: args.operation.operationId,
    path: withPinned({
      build: buildPathFn(args.pathTemplate, pathParams),
      pinned,
    })!,
    query: withPinned({ build: buildQueryFn(queryParams), pinned }),
    body: buildBodyFn(bodyProps),
    acceptedBodyFields,
    extensions: extractExtensions(args.operation),
    serverManagedParameters,
  };
};

export const processPath = (args: {
  pathTemplate: string;
  pathItem: Record<string, OperationSpec>;
  spec: OpenApiSpec;
  options: ResolvedToolOptions;
}): ToolDefinition[] => {
  // `parameters` is a path-item-level key (shared params), not an operation.
  const rawPathItemParameters = (args.pathItem as { parameters?: unknown })
    .parameters;
  const pathItemParameters = Array.isArray(rawPathItemParameters)
    ? rawPathItemParameters
    : [];

  const tools: ToolDefinition[] = [];
  for (const [method, operation] of Object.entries(args.pathItem)) {
    if (method === 'parameters') continue;
    const tool = processOperation({
      pathTemplate: args.pathTemplate,
      method,
      operation,
      spec: args.spec,
      options: args.options,
      pathItemParameters,
    });
    if (tool) {
      tools.push(tool);
    }
  }
  return tools;
};

/** Applies the defaults to {@link OpenApiToToolsOptions}. */
const resolveOptions = (
  options: OpenApiToToolsOptions = {}
): ResolvedToolOptions => {
  return {
    excludeExtension: options.excludeExtension ?? DEFAULT_EXCLUDE_EXTENSION,
    serverManagedExtension:
      options.serverManagedExtension ?? DEFAULT_SERVER_MANAGED_EXTENSION,
    argumentNames: options.argumentNames ?? 'camelCase',
    documents: options.documents,
  };
};

/**
 * Translates one or more OpenAPI documents into REST-backed MCP tool
 * definitions. Each translatable operation (has an `operationId`, a supported
 * HTTP method, and is not excluded) becomes one {@link ToolDefinition}.
 *
 * @example
 * ```typescript
 * import { openApiToToolDefinitions } from '@ttoss/http-server-mcp-openapi';
 *
 * const tools = openApiToToolDefinitions({ spec: myOpenApiDocument });
 * ```
 */
export const openApiToToolDefinitions = (args: {
  spec: OpenApiSpec | OpenApiSpec[];
  options?: OpenApiToToolsOptions;
}): ToolDefinition[] => {
  const options = resolveOptions(args.options);

  const specs = Array.isArray(args.spec) ? args.spec : [args.spec];
  const tools: ToolDefinition[] = [];

  for (const spec of specs) {
    const paths = spec.paths || {};
    for (const [pathTemplate, pathItem] of Object.entries(paths)) {
      tools.push(
        ...processPath({
          pathTemplate,
          pathItem: pathItem as Record<string, OperationSpec>,
          spec,
          options,
        })
      );
    }
  }

  return tools;
};
