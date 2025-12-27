import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { Router } from '@ttoss/http-server';
import type { Context } from 'koa';

/**
 * Options for configuring the MCP router
 */
export interface McpRouterOptions {
  /**
   * The HTTP path where the MCP server will be mounted
   * @default '/mcp'
   */
  path?: string;

  /**
   * Optional session ID generator for stateful MCP servers
   * Set to undefined for stateless servers
   */
  sessionIdGenerator?: () => string;
}

/**
 * Creates a Koa router configured to handle MCP protocol requests
 *
 * @param server - The MCP server instance with registered tools and resources
 * @param options - Configuration options for the router
 * @returns A Koa Router instance configured for MCP
 *
 * @example
 * ```typescript
 * import { App, bodyParser } from '@ttoss/http-server';
 * import { createMcpRouter, Server as McpServer, z } from '@ttoss/http-server-mcp';
 *
 * const mcpServer = new McpServer({
 *   name: 'my-server',
 *   version: '1.0.0',
 * });
 *
 * mcpServer.registerTool(
 *   'hello',
 *   {
 *     description: 'Say hello',
 *     inputSchema: { name: z.string() },
 *   },
 *   async ({ name }) => ({
 *     content: [{ type: 'text', text: `Hello, ${name}!` }],
 *   })
 * );
 *
 * const app = new App();
 * app.use(bodyParser());
 *
 * const mcpRouter = createMcpRouter(mcpServer);
 * app.use(mcpRouter.routes());
 *
 * app.listen(3000);
 * ```
 */
export const createMcpRouter = (
  server: McpServer,
  options: McpRouterOptions = {}
) => {
  const { path = '/mcp', sessionIdGenerator } = options;

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator,
    enableJsonResponse: true,
  });

  // Connect the transport to the MCP server
  server.connect(transport);

  const router = new Router();

  router.post(path, async (ctx: Context) => {
    try {
      // The MCP SDK expects Node.js IncomingMessage and ServerResponse
      // Koa's ctx.req and ctx.res are these objects
      await transport.handleRequest(ctx.req, ctx.res, ctx.request.body);

      // Prevent Koa from sending its own response
      // The MCP SDK has already handled the response
      ctx.respond = false;
    } catch (error) {
      // Only handle errors if headers haven't been sent
      if (!ctx.res.headersSent) {
        ctx.status = 500;
        ctx.body = {
          error:
            error instanceof Error ? error.message : 'Internal server error',
        };
      }
    }
  });

  // Support DELETE for session termination (per MCP spec)
  router.delete(path, async (ctx: Context) => {
    try {
      await transport.handleRequest(ctx.req, ctx.res, undefined);
      ctx.respond = false;
    } catch (error) {
      if (!ctx.res.headersSent) {
        ctx.status = 500;
        ctx.body = {
          error:
            error instanceof Error ? error.message : 'Internal server error',
        };
      }
    }
  });

  return router;
};

/**
 * Re-export MCP SDK types and classes for convenience
 */
export type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
export { McpServer as Server } from '@modelcontextprotocol/sdk/server/mcp.js';

/**
 * Re-export Zod for request/response schema definitions
 */
export { z } from 'zod';
