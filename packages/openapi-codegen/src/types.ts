export interface OpenApiComponents {
  schemas?: Record<string, unknown>;
  responses?: Record<string, unknown>;
  securitySchemes?: Record<string, unknown>;
  parameters?: Record<string, unknown>;
}

export interface OpenApiSpec {
  openapi: string;
  info?: Record<string, unknown>;
  servers?: unknown[];
  tags?: Array<{ name: string }>;
  paths?: Record<string, unknown>;
  components?: OpenApiComponents;
  security?: unknown[];
}
