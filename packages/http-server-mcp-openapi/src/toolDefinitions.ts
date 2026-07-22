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
    if ('type' in param) {
      const jsonType = getJsonSchemaType(param.type);
      const description = sanitizeDescription(param.description);
      if (param.type === 'array') {
        const itemsSchema =
          'items' in param && param.items
            ? param.items
            : { type: 'string' as const };
        properties[param.camelName] = {
          type: 'array',
          items: itemsSchema,
          description,
        };
      } else {
        properties[param.camelName] = {
          type: jsonType,
          description,
        };
      }
    } else {
      // path param
      properties[param.camelName] = {
        type: 'string',
        description: '',
      };
    }
  }

  return {
    type: 'object',
    properties,
    required: requiredFields.length > 0 ? requiredFields : undefined,
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
    };
    return {
      snakeName: key,
      camelName: snakeToCamel(key),
      description: typeof val.description === 'string' ? val.description : '',
      required: (bodySchema.required || []).includes(key),
      type: typeof val.type === 'string' ? val.type : 'string',
      items: val.items,
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
