import type {
  CallToolResult,
  JsonSchemaType,
  McpServer,
  StandardSchemaWithJSON,
} from '@modelcontextprotocol/server';
import { fromJsonSchema } from '@modelcontextprotocol/server';

/**
 * A plain JSON Schema object (draft-07 compatible) describing the shape of a
 * tool's input. Used with {@link registerToolFromSchema} as an alternative to
 * providing a Zod shape, enabling lossless round-trips for schemas that contain
 * features not expressible in Zod v3 (`anyOf`, `$ref`, `pattern`, `allOf`, …).
 */
export interface JsonObjectSchema {
  type: 'object';
  properties?: Record<string, unknown>;
  required?: string[];
  [key: string]: unknown;
}

/**
 * Parameters accepted by {@link registerToolFromSchema}.
 */
export interface RegisterToolFromSchemaParams {
  /** Unique tool name. */
  name: string;
  /** Human-readable description shown to the AI client. */
  description?: string;
  /**
   * Plain JSON Schema that describes the tool's input object.
   * This schema is forwarded verbatim over the MCP wire protocol, so any
   * JSON Schema feature (`anyOf`, `$ref`, `pattern`, …) is preserved without
   * loss. Defaults to `{ type: 'object', properties: {} }` when omitted.
   */
  inputSchema?: JsonObjectSchema;
  /**
   * Whether `tools/call` arguments are validated against `inputSchema` before
   * the handler runs, rejecting a mismatch with an MCP error.
   *
   * Defaults to `false`, which forwards arguments to the handler unchecked —
   * the behavior this helper has always had. `inputSchema` is still advertised
   * verbatim over `tools/list` either way; this only controls enforcement.
   *
   * Enable it once you know `inputSchema` describes every value the tool
   * genuinely accepts. Schemas generated from an OpenAPI document are a common
   * source of *incomplete* ones — a field a client may send as `null` to clear
   * it, or one accepting several shapes, is easy to emit as a bare
   * `{ type: 'string' }`. Validating against a schema like that rejects calls
   * the underlying API would have accepted.
   *
   * @default false
   */
  validateArguments?: boolean;
  /**
   * Tool handler invoked when the AI client calls the tool.
   * Receives the request arguments, validated against `inputSchema` only when
   * `validateArguments` is enabled.
   */
  handler: (
    args: Record<string, unknown>
  ) => CallToolResult | Promise<CallToolResult>;
}

/**
 * Converts a plain JSON Schema into the Standard Schema `registerTool` accepts.
 *
 * A Standard Schema keeps advertisement and enforcement in separate fields:
 * `~standard.jsonSchema` is what `tools/list` publishes, `~standard.validate`
 * is what `tools/call` runs. Replacing only `validate` therefore keeps the
 * schema fully visible to clients while leaving arguments unchecked.
 */
const toStandardSchema = ({
  inputSchema,
  validateArguments,
}: {
  inputSchema: JsonObjectSchema;
  validateArguments: boolean;
}): StandardSchemaWithJSON => {
  // `JsonObjectSchema` deliberately keeps `properties` as `Record<string,
  // unknown>` for a simple public API; `fromJsonSchema` wants the SDK's
  // recursive `JsonSchemaType`. The runtime shape is the same JSON Schema
  // object either way — only the static type is looser here.
  const schema = fromJsonSchema(inputSchema as JsonSchemaType);

  if (validateArguments) {
    return schema;
  }

  return {
    '~standard': {
      ...schema['~standard'],
      validate: (value: unknown) => {
        return { value };
      },
    },
  } as StandardSchemaWithJSON;
};

/**
 * Registers a tool on an MCP server using a **plain JSON Schema** object for
 * `inputSchema` instead of a Zod shape.
 *
 * This is useful when tool definitions are shared between the MCP server and
 * an AI SDK agent (e.g. Vercel AI SDK's `tool()` helper), because both consume
 * a plain JSON Schema at runtime. Using this helper eliminates the lossy
 * JSON-Schema→Zod conversion that would otherwise be required.
 *
 * Thin wrapper over `@modelcontextprotocol/server`'s `fromJsonSchema`, which
 * converts a JSON Schema into a Standard Schema that `registerTool` accepts
 * directly, so the schema round-trips verbatim over `tools/list`. Arguments
 * reach the handler unchecked unless `validateArguments` is enabled.
 *
 * @param server - The `McpServer` instance to register the tool on.
 * @param params - Tool configuration including name, description, inputSchema,
 *   validateArguments, and handler.
 *
 * @example
 * ```typescript
 * import { registerToolFromSchema, McpServer } from '@ttoss/http-server-mcp';
 *
 * const server = new McpServer({ name: 'my-server', version: '1.0.0' });
 *
 * registerToolFromSchema(server, {
 *   name: 'get-project',
 *   description: 'Get a project by ID',
 *   inputSchema: {
 *     type: 'object',
 *     properties: { id: { type: 'string', description: 'Project public ID' } },
 *     required: ['id'],
 *   },
 *   handler: async ({ id }) => ({
 *     content: [{ type: 'text', text: `Project: ${id}` }],
 *   }),
 * });
 * ```
 */
export const registerToolFromSchema = (
  server: McpServer,
  params: RegisterToolFromSchemaParams
): void => {
  const {
    name,
    description,
    inputSchema = { type: 'object', properties: {} },
    validateArguments = false,
    handler,
  } = params;

  server.registerTool(
    name,
    {
      description,
      inputSchema: toStandardSchema({ inputSchema, validateArguments }),
    },
    async (args) => {
      return handler(args as Record<string, unknown>);
    }
  );
};
