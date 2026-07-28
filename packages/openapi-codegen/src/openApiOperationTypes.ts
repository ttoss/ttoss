/**
 * Narrow, CLI-generation-specific view of the OpenAPI shapes this package
 * reads (parameters, request bodies, path items). Kept separate from the
 * looser {@link import('./types').OpenApiSpec} used by `mergeOpenApiSpecs`,
 * which only needs to move whole sections around without inspecting them.
 */
export interface OpenApiParameter {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  $ref?: string;
}

export interface OpenApiSchema {
  type?: string;
  default?: unknown;
}

export interface OpenApiParameterFull extends OpenApiParameter {
  description?: string;
  required?: boolean;
  schema?: OpenApiSchema;
}

export interface OpenApiRequestBodyProperty {
  type?: string;
  description?: string;
  nullable?: boolean;
  $ref?: string;
}

export interface OpenApiRequestBodySchema {
  required?: string[];
  properties?: Record<string, OpenApiRequestBodyProperty>;
  oneOf?: OpenApiRequestBodySchema[];
}

export interface OpenApiRequestBody {
  required?: boolean;
  content?: {
    'application/json'?: {
      schema?: OpenApiRequestBodySchema;
    };
  };
}

export interface OpenApiOperation {
  operationId?: string;
  tags?: string[];
  summary?: string;
  description?: string;
  parameters?: OpenApiParameterFull[];
  requestBody?: OpenApiRequestBody;
}

export interface OpenApiPathItem {
  get?: OpenApiOperation;
  post?: OpenApiOperation;
  put?: OpenApiOperation;
  patch?: OpenApiOperation;
  delete?: OpenApiOperation;
  parameters?: OpenApiParameterFull[];
}

export interface OpenApiComponents {
  parameters?: Record<string, OpenApiParameterFull>;
  schemas?: Record<string, OpenApiRequestBodySchema & { $ref?: string }>;
}

export interface CliOpenApiSpec {
  tags?: Array<{ name: string }>;
  paths?: Record<string, OpenApiPathItem>;
  components?: OpenApiComponents;
}
