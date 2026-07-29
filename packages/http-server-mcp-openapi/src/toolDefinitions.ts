import type { JsonObjectSchema } from '@ttoss/http-server-mcp';

import {
  buildBodyFn,
  buildPathFn,
  buildQueryFn,
  dereferenceSchema,
  resolveParameter,
  resolveSchema,
} from './schema';
import {
  DEFAULT_EXCLUDE_EXTENSION,
  DEFAULT_SERVER_MANAGED_EXTENSION,
  type JsonSchemaProperty,
  type OpenApiSpec,
  type OpenApiToToolsOptions,
  type OperationSpec,
  type RequestBodySpec,
  type ToolDefinition,
} from './types';

/**
 * Folds `_` and `-` separators into camelCase. OpenAPI operation and parameter
 * names may be snake_case (`agent_id`) or kebab-case (`list-tools`), and MCP
 * tool inputs are camelCase by convention, so both are folded here.
 */
export const snakeToCamel = (str: string): string => {
  return str.replace(/[_-]([a-z])/g, (_, letter) => {
    return letter.toUpperCase();
  });
};

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
 * Builds a single body/query property's `JsonSchemaProperty`. Split out of
 * {@link buildInputSchema} to keep that function's size and branching down.
 */
const buildTypedProperty = (param: {
  type: string;
  description: string;
  items?: unknown;
  nullable?: boolean;
  oneOf?: unknown[];
  anyOf?: unknown[];
}): JsonSchemaProperty => {
  const description = sanitizeDescription(param.description);

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
  pathParams: Array<{ name: string; camelName: string }>,
  queryParams: Array<{
    name: string;
    camelName: string;
    description: string;
    required: boolean;
    type: string;
  }>,
  bodyProps: Array<{
    snakeName: string;
    camelName: string;
    description: string;
    required: boolean;
    type: string;
    items?: unknown;
    nullable?: boolean;
    oneOf?: unknown[];
    anyOf?: unknown[];
  }>
): JsonObjectSchema => {
  const allParams = [...pathParams, ...queryParams, ...bodyProps];

  if (allParams.length === 0) {
    return {
      type: 'object',
    };
  }

  const requiredFields = [
    ...pathParams.map((p) => {
      return p.camelName;
    }),
    ...queryParams
      .filter((p) => {
        return p.required;
      })
      .map((p) => {
        return p.camelName;
      }),
    ...bodyProps
      .filter((p) => {
        return p.required;
      })
      .map((p) => {
        return p.camelName;
      }),
  ];

  const properties: Record<string, JsonSchemaProperty> = {};
  for (const param of allParams) {
    properties[param.camelName] =
      'type' in param
        ? buildTypedProperty(param)
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

/**
 * Deduplicates parameter entries by `name`, keeping the last occurrence. When
 * path-item-level and operation-level parameters are concatenated (operation
 * last), this makes the operation-level entry win — as the OpenAPI spec requires.
 */
const dedupeByName = <T extends { name: string }>(items: T[]): T[] => {
  const byName = new Map<string, T>();
  for (const item of items) {
    byName.set(item.name, item);
  }
  return [...byName.values()];
};

export const extractPathParams = (args: {
  parameters?: Array<{ name?: string; in?: string; [key: string]: unknown }>;
  spec: OpenApiSpec;
}): Array<{ name: string; camelName: string }> => {
  const params = (args.parameters || [])
    .map((p) => {
      return resolveParameter(p, args.spec);
    })
    .filter((p) => {
      return p.in === 'path';
    })
    .map((p) => {
      return {
        name: p.name || '',
        camelName: snakeToCamel(p.name || ''),
      };
    });
  return dedupeByName(params);
};

export const extractQueryParams = (args: {
  parameters?: Array<{ name?: string; in?: string; [key: string]: unknown }>;
  spec: OpenApiSpec;
}): Array<{
  name: string;
  camelName: string;
  description: string;
  required: boolean;
  type: string;
}> => {
  const params = (args.parameters || [])
    .map((p) => {
      return resolveParameter(p, args.spec);
    })
    .filter((p) => {
      return p.in === 'query';
    })
    .map((p) => {
      return {
        name: p.name || '',
        camelName: snakeToCamel(p.name || ''),
        description: p.description || '',
        required: p.required || false,
        type: p.schema?.type || 'string',
      };
    });
  return dedupeByName(params);
};

const resolveBodySchema = (args: {
  requestBody?: RequestBodySpec;
  spec: OpenApiSpec;
}) => {
  const rawBodySchema = args.requestBody?.content?.['application/json']?.schema;
  const dereferencedBodySchema = dereferenceSchema(rawBodySchema, args.spec);
  return resolveSchema(dereferencedBodySchema, args.spec);
};

/**
 * snake_case names of every top-level property an operation's request schema
 * declares, including server-managed ones.
 */
export const extractAcceptedBodyFields = (args: {
  requestBody?: RequestBodySpec;
  spec: OpenApiSpec;
}): string[] => {
  const bodySchema = resolveBodySchema(args);
  return Object.keys(bodySchema?.properties ?? {});
};

export const extractBodyProps = (args: {
  requestBody?: RequestBodySpec;
  spec: OpenApiSpec;
  serverManagedExtension: string;
}): Array<{
  snakeName: string;
  camelName: string;
  description: string;
  required: boolean;
  type: string;
  items?: unknown;
  nullable: boolean;
  oneOf?: unknown[];
  anyOf?: unknown[];
}> => {
  const bodySchema = resolveBodySchema(args);
  if (!bodySchema?.properties) return [];
  const entries = Object.entries(bodySchema.properties).filter(
    ([, value]: [string, unknown]) => {
      const val = value as Record<string, unknown>;
      return !val[args.serverManagedExtension];
    }
  );
  return entries.map(([key, value]: [string, unknown]) => {
    const val = value as {
      description?: unknown;
      type?: unknown;
      items?: unknown;
      nullable?: unknown;
      oneOf?: unknown;
      anyOf?: unknown;
    };
    return {
      snakeName: key,
      camelName: snakeToCamel(key),
      description: typeof val.description === 'string' ? val.description : '',
      required: (bodySchema.required || []).includes(key),
      type: typeof val.type === 'string' ? val.type : 'string',
      items: val.items,
      nullable: val.nullable === true,
      oneOf: Array.isArray(val.oneOf) ? val.oneOf : undefined,
      anyOf: Array.isArray(val.anyOf) ? val.anyOf : undefined,
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
  options: Required<OpenApiToToolsOptions>;
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

  const pathParams = extractPathParams({
    parameters,
    spec: args.spec,
  });

  const queryParams = extractQueryParams({
    parameters,
    spec: args.spec,
  });

  const bodyProps = extractBodyProps({
    requestBody: args.operation.requestBody,
    spec: args.spec,
    serverManagedExtension: args.options.serverManagedExtension,
  });

  const inputSchema = buildInputSchema(pathParams, queryParams, bodyProps);

  const acceptedBodyFields = extractAcceptedBodyFields({
    requestBody: args.operation.requestBody,
    spec: args.spec,
  });

  return {
    name: toolName,
    description: sanitizeDescription(args.operation.description),
    inputSchema,
    method: httpMethod,
    pathTemplate: args.pathTemplate,
    operationId: args.operation.operationId,
    path: buildPathFn(args.pathTemplate, pathParams),
    query: buildQueryFn(queryParams),
    body: buildBodyFn(bodyProps),
    acceptedBodyFields,
    extensions: extractExtensions(args.operation),
  };
};

export const processPath = (args: {
  pathTemplate: string;
  pathItem: Record<string, OperationSpec>;
  spec: OpenApiSpec;
  options: Required<OpenApiToToolsOptions>;
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
  const options: Required<OpenApiToToolsOptions> = {
    excludeExtension:
      args.options?.excludeExtension ?? DEFAULT_EXCLUDE_EXTENSION,
    serverManagedExtension:
      args.options?.serverManagedExtension ?? DEFAULT_SERVER_MANAGED_EXTENSION,
  };

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
