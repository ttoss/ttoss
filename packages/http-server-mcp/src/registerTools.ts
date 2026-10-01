import type { McpServer } from '@modelcontextprotocol/server';

import { registerDirectTool, type Tool } from './tool';
import { registerToolCatalog, type ToolCatalogOptions } from './toolCatalog';

/** Parameters for {@link registerTools}. */
export interface RegisterToolsParams {
  /** The MCP server the tools are registered on. */
  server: McpServer;
  /** The tools to expose. */
  tools: Tool[];
  /**
   * Exposes `tools` behind a `search` / `describe` / `call` catalog instead
   * of one MCP tool each. `true` takes every {@link ToolCatalogOptions}
   * default.
   *
   * A large tool set overflows a client's context: every definition ships to
   * the model on every turn, some providers cap the number of tools per
   * request, and clients that don't defer tool loading choke on the list.
   * Behind a catalog the model sees three small definitions, and a schema
   * enters its context only for the tools it is about to use.
   *
   * @default false
   */
  catalog?: boolean | ToolCatalogOptions;
}

/**
 * Registers tools on an MCP server, either one MCP tool each (the default)
 * or behind a search / describe / call catalog. The same `tools` can feed
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
 * registerTools({ server: catalogServer, tools, catalog: true });
 * ```
 */
export const registerTools = ({
  server,
  tools,
  catalog = false,
}: RegisterToolsParams): void => {
  if (catalog === false) {
    for (const tool of tools) registerDirectTool({ server, tool });
    return;
  }
  registerToolCatalog({
    server,
    tools,
    ...(catalog === true ? {} : catalog),
  });
};
