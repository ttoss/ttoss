import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

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
   * Tool handler invoked when the AI client calls the tool.
   * Receives the raw request arguments as a plain object (no Zod validation is
   * applied, so the shape matches whatever the client sends).
   */
  handler: (
    args: Record<string, unknown>
  ) => CallToolResult | Promise<CallToolResult>;
}

// Module-level WeakMaps so they survive across calls but are GC-friendly.
const rawSchemaRegistryMap = new WeakMap<
  McpServer,
  Map<string, JsonObjectSchema>
>();
const patchedServerSet = new WeakSet<McpServer>();

/**
 * Registers a tool on an MCP server using a **plain JSON Schema** object for
 * `inputSchema` instead of a Zod shape.
 *
 * This is useful when tool definitions are shared between the MCP server and an
 * AI SDK agent (e.g. Vercel AI SDK's `tool()` helper), because both consume a
 * plain JSON Schema at runtime. Using this helper eliminates the lossy
 * JSON-Schema→Zod conversion that would otherwise be required.
 *
 * Internally the helper:
 * 1. Registers the tool via the standard `McpServer.registerTool` API using a
 *    Zod `z.record(z.unknown())` pass-through schema so that the existing MCP
 *    `tools/call` handler correctly routes requests and delivers raw args to
 *    your handler.
 * 2. Stores the original JSON Schema and patches the `tools/list` response
 *    handler so clients receive the verbatim JSON Schema over the wire.
 *
 * @param server - The `McpServer` instance to register the tool on.
 * @param params - Tool configuration including name, description, inputSchema,
 *   and handler.
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
    handler,
  } = params;

  // Ensure we have a schema registry for this server.
  if (!rawSchemaRegistryMap.has(server)) {
    rawSchemaRegistryMap.set(server, new Map());
  }

  const registry = rawSchemaRegistryMap.get(server)!;
  registry.set(name, inputSchema);

  // Register the tool with a Zod record schema so that:
  //  - `tools/call` validation always passes for any object input.
  //  - The handler receives the raw args object from the request.
  server.registerTool(
    name,
    {
      description,
      inputSchema: z.record(z.string(), z.unknown()),
    },
    async (args) => {
      return handler(args as Record<string, unknown>);
    }
  );

  // Patch the `tools/list` response handler once per server so that the
  // verbatim JSON Schema is returned instead of the Zod-derived one.
  if (!patchedServerSet.has(server)) {
    patchedServerSet.add(server);

    // Access the underlying `Server` instance and its internal request-handler
    // map. This relies on McpServer exposing a `server` property (documented in
    // the SDK's public API) and Protocol storing handlers in `_requestHandlers`
    // (an internal implementation detail). If the MCP SDK refactors its
    // internals, the patching is simply skipped and tools remain functional —
    // the only degradation is that the Zod-derived schema is shown instead of
    // the verbatim JSON Schema in `tools/list`.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawServer = (server as any).server;
    const origHandler = rawServer?._requestHandlers?.get('tools/list') as
      | ((req: unknown, extra: unknown) => Promise<{ tools: unknown[] }>)
      | undefined;

    if (!origHandler && process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn(
        '[registerToolFromSchema] Could not patch tools/list — ' +
          'internal MCP SDK structure may have changed. ' +
          'The tool will still be callable, but tools/list may return ' +
          'a Zod-derived schema instead of the verbatim JSON Schema.'
      );
    }

    if (origHandler) {
      rawServer._requestHandlers.set(
        'tools/list',
        async (rawRequest: unknown, extra: unknown) => {
          const result = await origHandler(rawRequest, extra);

          const schemas = rawSchemaRegistryMap.get(server);
          if (!schemas) {
            return result;
          }

          return {
            ...result,
            tools: (
              result.tools as Array<{
                name: string;
                inputSchema: unknown;
                [key: string]: unknown;
              }>
            ).map((tool) => {
              const raw = schemas.get(tool.name);
              if (raw !== undefined) {
                return { ...tool, inputSchema: raw };
              }
              return tool;
            }),
          };
        }
      );
    }
  }
};
