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

/**
 * The slice of JSON Schema this package reads. Parameter schemas,
 * request-body schemas and body properties are all the same shape in
 * OpenAPI, so they share one type — and one resolver.
 */
export interface OpenApiSchema {
  type?: string;
  default?: unknown;
  description?: string;
  nullable?: boolean;
  $ref?: string;
  required?: string[];
  properties?: Record<string, OpenApiSchema>;
  /** OpenAPI 3.0 has no union `type`, so a union is spelled with these. */
  oneOf?: OpenApiSchema[];
  anyOf?: OpenApiSchema[];
  allOf?: OpenApiSchema[];
}

export interface OpenApiParameterFull extends OpenApiParameter {
  description?: string;
  required?: boolean;
  schema?: OpenApiSchema;
}

export interface OpenApiRequestBody {
  required?: boolean;
  content?: {
    'application/json'?: {
      schema?: OpenApiSchema;
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
  schemas?: Record<string, OpenApiSchema>;
}

export interface CliOpenApiSpec {
  tags?: Array<{ name: string }>;
  paths?: Record<string, OpenApiPathItem>;
  components?: OpenApiComponents;
}
