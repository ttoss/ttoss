import type { JsonObjectSchema } from '@ttoss/http-server-mcp';

/** The JSON Schema primitive types this generator can derive from an OpenAPI `type`. */
export type JsonSchemaPrimitiveType =
  'string' | 'number' | 'boolean' | 'array' | 'integer' | 'object' | 'null';

/**
 * A single JSON Schema property descriptor as emitted for a tool's
 * `inputSchema`. Only the subset of JSON Schema the generator produces is
 * modelled here; the value is forwarded verbatim over the MCP wire protocol.
 *
 * A property with OpenAPI `oneOf`/`anyOf` is forwarded as-is (no `type`) so a
 * client-side validator enforces the same alternatives the REST API does,
 * rather than collapsing to a single guessed primitive. `type` may be an
 * array of two entries (e.g. `['string', 'null']`) to represent an OpenAPI
 * `nullable: true` property without losing its declared type. A property with
 * no declared type is emitted untyped (only `description`), so it accepts any
 * value instead of a guessed `string`.
 */
export type JsonSchemaProperty =
  | {
      type: JsonSchemaPrimitiveType | JsonSchemaPrimitiveType[];
      description?: string;
      items?: unknown;
    }
  | {
      oneOf?: unknown[];
      anyOf?: unknown[];
      allOf?: unknown[];
      description?: string;
    };

/**
 * A REST-backed MCP tool derived from a single OpenAPI operation.
 *
 * The `path` / `query` / `body` builders turn the arguments an MCP client
 * sends (named per {@link OpenApiToToolsOptions.argumentNames}) into the pieces of an HTTP request against the original REST
 * API. They intentionally hold no transport concerns (base URL, auth); the
 * caller wires those in when it performs the request.
 */
export interface ToolDefinition {
  /** kebab-case tool name derived from the operation's `operationId`. */
  name: string;
  /** Sanitised operation description (quotes escaped, newlines flattened). */
  description: string;
  /** Plain JSON Schema describing the tool's input object. */
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
  /**
   * Builds the request body keyed by the spec's property names, or `undefined`
   * if the op has no body.
   */
  body?: (args: Record<string, unknown>) => Record<string, unknown>;
  /**
   * Spec names of every top-level request-body property the operation's
   * schema declares, including server-managed ones hidden from `inputSchema`.
   */
  acceptedBodyFields: string[];
  /**
   * Every `x-` prefixed extension declared on the operation, forwarded
   * verbatim. Lets consumers read custom metadata (e.g. `x-iam-action`)
   * without this package needing to know about it.
   */
  extensions: Record<string, unknown>;
  /**
   * Path and query parameters flagged with the server-managed extension. They
   * are absent from `inputSchema`, but `path` / `query` still read them from
   * the args under `argName`, so the consumer fills them before building the
   * request — `registerOpenApiTools` does it through `serverParameters`.
   */
  serverManagedParameters: ServerManagedParameter[];
}

/** A path or query parameter the server sets, never offered to the model. */
export interface ServerManagedParameter {
  /** The parameter's name in the spec. */
  name: string;
  /** Where the parameter goes. */
  in: 'path' | 'query';
  /** The args key `path` / `query` read the value from. */
  argName: string;
}

/** Minimal shape of an OpenAPI document consumed by the generator. */
export interface OpenApiSpec {
  paths?: Record<string, Record<string, unknown>>;
  components?: {
    schemas?: Record<string, unknown>;
    parameters?: Record<string, unknown>;
  };
}

/**
 * Documents a `$ref` may point into, keyed by the file part of the ref exactly
 * as the spec writes it (`./tags.yaml` in `./tags.yaml#/components/schemas/Tag`).
 * A leading `./` is optional on either side.
 */
export type OpenApiDocuments = Record<string, OpenApiSpec>;

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
    /** Query serialisation style, e.g. `form` (default) or `deepObject`. */
    style?: string;
    /** Whether each value gets its own key. Defaults to `true` for `form`. */
    explode?: boolean;
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
   * Extension flag that, when truthy, hides a value the server sets from the
   * generated `inputSchema`.
   *
   * - On a **request-body property**, the property stays in
   *   `acceptedBodyFields` and is never sent (the API sets it itself).
   * - On a **path or query parameter**, the parameter is listed in
   *   `serverManagedParameters` and the consumer supplies its value.
   *
   * @default 'x-mcp-server-managed'
   */
  serverManagedExtension?: string;
  /**
   * How tool argument names are derived from the spec's parameter and
   * body-property names.
   *
   * - `'camelCase'` folds `_` / `-` separators (`agent_id` → `agentId`) and maps
   *   them back when building the request.
   * - `'verbatim'` uses the spec's names unchanged, so the MCP contract matches
   *   the REST contract exactly.
   *
   * @default 'camelCase'
   */
  argumentNames?: 'camelCase' | 'verbatim';
  /**
   * Documents that `$ref`s with a file part resolve against, keyed by that
   * file part as the spec writes it — `./tags.yaml` for
   * `./tags.yaml#/components/schemas/Tag`. Refs inside a document resolve
   * relative to that document. A ref to a file absent from this map resolves
   * to an empty schema, which accepts any value.
   */
  documents?: OpenApiDocuments;
}

/** {@link OpenApiToToolsOptions} with every default applied. */
export type ResolvedToolOptions = Required<
  Omit<OpenApiToToolsOptions, 'documents'>
> &
  Pick<OpenApiToToolsOptions, 'documents'>;

export const DEFAULT_EXCLUDE_EXTENSION = 'x-mcp-exclude';
export const DEFAULT_SERVER_MANAGED_EXTENSION = 'x-mcp-server-managed';
