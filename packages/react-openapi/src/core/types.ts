export type JsonObject = { [key: string]: JsonValue };

export type JsonValue =
  string | number | boolean | null | JsonValue[] | JsonObject;

export type OpenApiSchema = {
  type?: string;
  format?: string;
  title?: string;
  enum?: (string | number)[];
  items?: OpenApiSchema;
  properties?: Record<string, OpenApiSchema>;
  required?: string[];
  description?: string;
  default?: JsonValue;
  $ref?: string;
  allOf?: OpenApiSchema[];
  /** Set by the server; never sent in a request body. */
  readOnly?: boolean;
  /** Sent in requests but never returned (e.g. a password). */
  writeOnly?: boolean;
  /** OpenAPI 3.0 nullability. */
  nullable?: boolean;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  example?: JsonValue;
  /**
   * Marks a field the UI should never display in clear text (tokens, secrets).
   * Complements the name-based heuristic in `isSensitiveKey`.
   */
  'x-sensitive'?: boolean;
  [extension: `x-${string}`]: unknown;
};

export type OpenApiParameter = {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie' | string;
  required?: boolean;
  schema?: OpenApiSchema;
  description?: string;
};

export type OpenApiOperation = {
  operationId: string;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: OpenApiParameter[];
  requestBody?: {
    required?: boolean;
    content?: Record<string, { schema?: OpenApiSchema }>;
  };
  responses?: Record<
    string,
    { content?: Record<string, { schema?: OpenApiSchema }> }
  >;
};

export const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const;

export type HttpMethod = (typeof HTTP_METHODS)[number];

export type OpenApiPathItem = Partial<Record<HttpMethod, OpenApiOperation>> & {
  parameters?: OpenApiParameter[];
};

export type OpenApiSpec = {
  openapi?: string;
  info?: { title?: string; version?: string };
  paths?: Record<string, OpenApiPathItem>;
  components?: {
    schemas?: Record<string, OpenApiSchema>;
  };
};

/**
 * An operation located in the spec: its HTTP method, its path template
 * (e.g. `/api/v1/clients/{client_id}`) and the operation object itself.
 */
export type ResolvedOperation = {
  method: HttpMethod;
  pathTemplate: string;
  operation: OpenApiOperation;
};

export type ParamValue = string | number | boolean | null | undefined;

export type OperationParams = Record<string, ParamValue>;
