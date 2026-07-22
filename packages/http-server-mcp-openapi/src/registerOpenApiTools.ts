import { type McpServer, registerToolFromSchema } from '@ttoss/http-server-mcp';

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
  /** snake_case request body, or `undefined` when the operation has none. */
  body?: Record<string, unknown>;
  /** The tool definition the call resolved to (for auth/metadata lookups). */
  tool: ToolDefinition;
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
   * Serialises the raw API data into the MCP tool's text payload.
   * @default (data) => JSON.stringify(data, null, 2)
   */
  toText?: (data: unknown) => string;
}

const defaultToText = (data: unknown): string => {
  return typeof data === 'string' ? data : JSON.stringify(data, null, 2);
};

/**
 * Derives MCP tools from OpenAPI document(s) and registers each on the given
 * MCP server. Every tool's handler resolves the incoming camelCase args into a
 * concrete HTTP request and delegates execution to `callApi`.
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
 *   callApi: async ({ method, url, body }) => {
 *     const res = await fetch(`https://api.example.com${url}`, {
 *       method,
 *       headers: { 'Content-Type': 'application/json' },
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
      handler: async (handlerArgs: Record<string, unknown>) => {
        const url =
          tool.path(handlerArgs) + (tool.query ? tool.query(handlerArgs) : '');
        const data = await args.callApi({
          method: tool.method,
          url,
          body: tool.body ? tool.body(handlerArgs) : undefined,
          tool,
        });
        return { content: [{ type: 'text' as const, text: toText(data) }] };
      },
    });
  }

  return tools;
};
