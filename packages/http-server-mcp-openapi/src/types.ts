import type { JsonObjectSchema } from '@ttoss/http-server-mcp';

/**
 * A single JSON Schema property descriptor as emitted for a tool's
 * `inputSchema`. Only the subset of JSON Schema the generator produces is
 * modelled here; the value is forwarded verbatim over the MCP wire protocol.
 */
export interface JsonSchemaProperty {
  type:
    | 'string'
    | 'number'
    | 'boolean'
    | 'array'
    | 'integer'
    | 'object'
    | 'null';
  description?: string;
  items?: unknown;
}

/**
 * A REST-backed MCP tool derived from a single OpenAPI operation.
 *
 * The `path` / `query` / `body` builders turn the camelCase arguments an MCP
 * client sends into the pieces of an HTTP request against the original REST
 * API. They intentionally hold no transport concerns (base URL, auth); the
 * caller wires those in when it performs the request.
 */
export interface ToolDefinition {
  /** kebab-case tool name derived from the operation's `operationId`. */
  name: string;
  /** Sanitised operation description (quotes escaped, newlines flattened). */
  description: string;
  /** Plain JSON Schema describing the tool's camelCase input object. */
  inputSchema: JsonObjectSchema;
  /** Uppercase HTTP method (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`). */
  method: string;
  /** The raw OpenAPI path template, e.g. `/agents/{agent_id}`. */
  pathTemplate: string;
  /** The operation's `operationId`. */
  operationId: string;
  /** Builds the request path, substituting path params from the args. */
  path: (args: Record<string, unknown>) => string;
  /** Builds the query string (including leading `?`), or `undefined` if none. */
  query?: (args: Record<string, unknown>) => string;
  /** Builds the snake_case request body, or `undefined` if the op has no body. */
  body?: (args: Record<string, unknown>) => Record<string, unknown>;
  /**
   * snake_case names of every top-level request-body property the operation's
   * schema declares, including server-managed ones hidden from `inputSchema`.
   */
  acceptedBodyFields: string[];
  /**
   * Every `x-` prefixed extension declared on the operation, forwarded
   * verbatim. Lets consumers read custom metadata (e.g. `x-iam-action`)
   * without this package needing to know about it.
   */
  extensions: Record<string, unknown>;
}

/** Minimal shape of an OpenAPI document consumed by the generator. */
export interface OpenApiSpec {
  paths?: Record<string, Record<string, unknown>>;
  components?: {
    schemas?: Record<string, unknown>;
    parameters?: Record<string, unknown>;
  };
}

export type RequestBodySpec = {
  required?: boolean;
  content?: {
    'application/json'?: {
      schema?: {
        type?: string;
        required?: string[];
        properties?: Record<string, unknown>;
        oneOf?: Array<Record<string, unknown>>;
        anyOf?: Array<Record<string, unknown>>;
        $ref?: string;
      };
    };
  };
};

export interface OperationSpec {
  operationId?: string;
  description?: string;
  parameters?: Array<{
    name?: string;
    in?: string;
    required?: boolean;
    description?: string;
    schema?: {
      type?: string;
      items?: { type?: string };
    };
    $ref?: string;
  }>;
  requestBody?: RequestBodySpec;
  [extension: string]: unknown;
}

/** Options that tune how operations and body properties are translated. */
export interface OpenApiToToolsOptions {
  /**
   * Operation-level extension flag that, when truthy, excludes the operation
   * from the generated tool surface.
   * @default 'x-mcp-exclude'
   */
  excludeExtension?: string;
  /**
   * Body-property extension flag that, when truthy, hides the property from the
   * generated `inputSchema` while keeping it in `acceptedBodyFields` (for
   * server-managed fields the API sets itself).
   * @default 'x-mcp-server-managed'
   */
  serverManagedExtension?: string;
}

export const DEFAULT_EXCLUDE_EXTENSION = 'x-mcp-exclude';
export const DEFAULT_SERVER_MANAGED_EXTENSION = 'x-mcp-server-managed';
