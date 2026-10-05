import type { McpServer } from '@modelcontextprotocol/server';

import { type DeferToolsOptions, registerDeferredTools } from './deferTools';
import { registerDirectTool, type Tool } from './tool';

/** Parameters for {@link registerTools}. */
export interface RegisterToolsParams {
  /** The MCP server the tools are registered on. */
  server: McpServer;
  /** The tools to expose. */
  tools: Tool[];
  /**
   * Defers `tools` behind three tools — `search`, `describe`, `call` —
   * instead of registering one MCP tool each. `true` takes every
   * {@link DeferToolsOptions} default.
   *
   * A large tool set overflows a client's context: every definition ships to
   * the model on every turn, some providers cap the number of tools per
   * request, and clients that don't defer tool loading choke on the list.
   * Deferred, the model sees three small definitions, and a schema
   * enters its context only for the tools it is about to use.
   *
   * @default false
   */
  defer?: boolean | DeferToolsOptions;
}

/**
 * Registers tools on an MCP server, either one MCP tool each (the default)
 * or deferred behind `search` / `describe` / `call`. The same `tools` can feed
 * both, so two endpoints over one API cannot drift apart.
 *
 * @example
 * ```typescript
 * import { McpServer, registerTools, z } from '@ttoss/http-server-mcp';
 *
 * const tools = [
 *   {
 *     name: 'get-project',
 *     description: 'Get a project by ID',
 *     inputSchema: z.object({ id: z.string() }),
 *     handler: async ({ id }) => ({
 *       content: [{ type: 'text', text: `Project: ${id}` }],
 *     }),
 *   },
 * ];
 *
 * registerTools({ server: fullServer, tools });
 * registerTools({ server: deferredServer, tools, defer: true });
 * ```
 */
export const registerTools = ({
  server,
  tools,
  defer = false,
}: RegisterToolsParams): void => {
  if (defer === false) {
    for (const tool of tools) registerDirectTool({ server, tool });
    return;
  }
  registerDeferredTools({
    server,
    tools,
    ...(defer === true ? {} : defer),
  });
};
