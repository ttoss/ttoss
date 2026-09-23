import {
  getApiHeaders,
  type McpServer,
  registerToolFromSchema,
} from '@ttoss/http-server-mcp';

import { openApiToToolDefinitions } from './toolDefinitions';
import type {
  OpenApiSpec,
  OpenApiToToolsOptions,
  ToolDefinition,
} from './types';

/** The resolved HTTP request a tool call maps to, before transport concerns. */
export interface ResolvedRequest {
  /** Uppercase HTTP method. */
  method: string;
  /** Request path including the query string, e.g. `/agents/agt_1?limit=10`. */
  url: string;
  /** Request body keyed by the spec's names, or `undefined` when the operation has none. */
  body?: Record<string, unknown>;
  /** The tool definition the call resolved to (for auth/metadata lookups). */
  tool: ToolDefinition;
  /**
   * The headers `createMcpRouter`'s `getApiHeaders` produced for the MCP
   * request this call belongs to — typically the caller's credentials. `{}`
   * when `getApiHeaders` is not configured.
   */
  headers: Record<string, string>;
}

export interface RegisterOpenApiToolsArgs {
  /** The MCP server the generated tools are registered on. */
  server: McpServer;
  /** One or more OpenAPI documents to derive tools from. */
  spec: OpenApiSpec | OpenApiSpec[];
  /** Tuning options forwarded to {@link openApiToToolDefinitions}. */
  options?: OpenApiToToolsOptions;
  /**
   * Performs the HTTP request for a resolved tool call and returns the raw
   * response data. This package builds the method/url/body; the caller owns
   * how the request is executed — base URL, auth headers, fetch impl, etc.
   */
  callApi: (request: ResolvedRequest) => Promise<unknown> | unknown;
  /**
   * Serialises the raw API data into the MCP tool's text payload. The default
   * passes strings through, pretty-prints anything else as JSON, and answers
   * {@link NO_CONTENT_TEXT} for an empty body (e.g. a `204`).
   */
  toText?: (data: unknown) => string;
  /**
   * Supplies the values of the tool's server-managed path and query
   * parameters (`tool.serverManagedParameters`), keyed by their spec name.
   * Runs on every call, after any value the model sent for those parameters
   * has been discarded.
   *
   * @example
   * ```typescript
   * serverParameters: ({ headers }) => ({
   *   project_id: projectIdFromToken(headers.Authorization),
   * }),
   * ```
   */
  serverParameters?: (args: {
    tool: ToolDefinition;
    headers: Record<string, string>;
  }) => Record<string, unknown> | Promise<Record<string, unknown>>;
}

/** The text the default `toText` answers when the API returned no body. */
export const NO_CONTENT_TEXT = 'Succeeded. The operation returned no content.';

const defaultToText = (data: unknown): string => {
  // `JSON.stringify(undefined)` is `undefined`, and a text block without text
  // fails the MCP SDK's result schema — so a successful `204` would reach the
  // client as an error even though the write committed.
  if (data === undefined || data === '') return NO_CONTENT_TEXT;
  return typeof data === 'string' ? data : JSON.stringify(data, null, 2);
};

/**
 * Replaces whatever the model sent for server-managed parameters with the
 * values `serverParameters` supplies, so the model can never set them.
 */
const applyServerParameters = async (args: {
  tool: ToolDefinition;
  handlerArgs: Record<string, unknown>;
  headers: Record<string, string>;
  serverParameters: RegisterOpenApiToolsArgs['serverParameters'];
}): Promise<Record<string, unknown>> => {
  const managed = args.tool.serverManagedParameters;
  if (managed.length === 0) return args.handlerArgs;

  const result = { ...args.handlerArgs };
  for (const param of managed) {
    delete result[param.argName];
  }

  const values = args.serverParameters
    ? await args.serverParameters({ tool: args.tool, headers: args.headers })
    : {};
  for (const param of managed) {
    if (values[param.name] !== undefined) {
      result[param.argName] = values[param.name];
    }
  }
  return result;
};

/**
 * Derives MCP tools from OpenAPI document(s) and registers each on the given
 * MCP server. Every tool's handler resolves the incoming args into a concrete
 * HTTP request and delegates execution to `callApi`.
 *
 * @returns The list of {@link ToolDefinition} that were registered.
 *
 * @example
 * ```typescript
 * import { McpServer } from '@ttoss/http-server-mcp';
 * import { registerOpenApiTools } from '@ttoss/http-server-mcp-openapi';
 *
 * const server = new McpServer({ name: 'my-api', version: '1.0.0' });
 *
 * registerOpenApiTools({
 *   server,
 *   spec: myOpenApiDocument,
 *   callApi: async ({ method, url, body, headers }) => {
 *     const res = await fetch(`https://api.example.com${url}`, {
 *       method,
 *       headers: { ...headers, 'Content-Type': 'application/json' },
 *       body: body ? JSON.stringify(body) : undefined,
 *     });
 *     return res.json();
 *   },
 * });
 * ```
 */
export const registerOpenApiTools = (
  args: RegisterOpenApiToolsArgs
): ToolDefinition[] => {
  const toText = args.toText ?? defaultToText;
  const tools = openApiToToolDefinitions({
    spec: args.spec,
    options: args.options,
  });

  for (const tool of tools) {
    registerToolFromSchema(args.server, {
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      handler: async (rawArgs: Record<string, unknown>) => {
        const headers = getApiHeaders();
        const handlerArgs = await applyServerParameters({
          tool,
          handlerArgs: rawArgs,
          headers,
          serverParameters: args.serverParameters,
        });
        const url =
          tool.path(handlerArgs) + (tool.query ? tool.query(handlerArgs) : '');
        const data = await args.callApi({
          method: tool.method,
          url,
          body: tool.body ? tool.body(handlerArgs) : undefined,
          tool,
          headers,
        });
        return { content: [{ type: 'text' as const, text: toText(data) }] };
      },
    });
  }

  return tools;
};
