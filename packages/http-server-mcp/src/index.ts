import { AsyncLocalStorage } from 'node:async_hooks';

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { Router } from '@ttoss/http-server';
import type { Context } from 'koa';

interface RequestContext {
  authToken: string;
  apiBaseUrl: string;
}

const requestContextStore = new AsyncLocalStorage<RequestContext>();

/**
 * Makes an authenticated REST API call using the current MCP request's auth token.
 *
 * This function must be called within an active MCP request context, i.e. from
 * inside a tool handler when `apiBaseUrl` was configured in `createMcpRouter`.
 * The `Authorization: Bearer <token>` header is forwarded automatically from
 * the incoming MCP request.
 *
 * @param method - HTTP method (e.g. `'GET'`, `'POST'`, `'PUT'`, `'DELETE'`)
 * @param path - Path to append to the configured `apiBaseUrl` (e.g. `'/portfolios'`)
 * @param body - Optional request body (serialised as JSON)
 * @returns Parsed JSON response body
 *
 * @example
 * ```typescript
 * import { apiCall, createMcpRouter, Server as McpServer } from '@ttoss/http-server-mcp';
 *
 * mcpServer.registerTool('list-portfolios', { description: '...', inputSchema: {} }, async () => {
 *   const data = await apiCall('GET', '/portfolios');
 *   return { content: [{ type: 'text', text: JSON.stringify(data) }] };
 * });
 *
 * const mcpRouter = createMcpRouter(mcpServer, {
 *   apiBaseUrl: `http://localhost:${process.env.PORT}/api/v1`,
 * });
 * ```
 */
export const apiCall = async (
  method: string,
  path: string,
  body?: unknown
): Promise<unknown> => {
  const context = requestContextStore.getStore();

  if (!context) {
    throw new Error(
      'apiCall must be called within an MCP request context. ' +
        'Ensure apiBaseUrl is configured in createMcpRouter.'
    );
  }

  const url = `${context.apiBaseUrl}${path}`;

  const response = await fetch(url, {
    method,
    headers: {
      ...(context.authToken
        ? { Authorization: `Bearer ${context.authToken}` }
        : {}),
      'Content-Type': 'application/json',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => {
      return { error: response.statusText };
    });

    throw new Error(
      (err as { error?: string }).error || `HTTP ${response.status}`
    );
  }

  return response.json();
};

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
   * Optional session ID generator for stateful MCP servers.
   * When provided, a single shared transport is created and sessions are tracked.
   * When undefined (default), the server operates in stateless mode where each
   * HTTP request uses its own transport instance.
   */
  sessionIdGenerator?: () => string;

  /**
   * Base URL for authenticated internal REST API calls made via `apiCall`.
   *
   * When set, `createMcpRouter` extracts the `Authorization` header from each
   * incoming MCP request and makes it available to the `apiCall` helper through
   * an `AsyncLocalStorage` context. Tool handlers can then call
   * `apiCall(method, path, body?)` without any additional setup.
   *
   * @example 'http://localhost:3000/api/v1'
   */
  apiBaseUrl?: string;
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
  const { path = '/mcp', sessionIdGenerator, apiBaseUrl } = options;
  const isStateful = sessionIdGenerator !== undefined;

  // Stateful mode: single shared transport connected once at startup
  let sharedTransport: StreamableHTTPServerTransport | undefined;
  if (isStateful) {
    sharedTransport = new StreamableHTTPServerTransport({
      sessionIdGenerator,
      enableJsonResponse: true,
    });
    // Connect the shared transport to the MCP server
    server.connect(sharedTransport);
  }

  // Stateless mode: SDK 1.x requires a fresh transport per request.
  // Requests are serialised so only one stateless transport is connected at a time.
  let statelessQueue: Promise<void> = Promise.resolve();

  const enqueueStateless = (work: () => Promise<void>): Promise<void> => {
    const result = statelessQueue.then(() => {
      return work();
    });
    // Keep the queue alive even if this work rejects so subsequent
    // requests are not blocked by a previous failure.
    statelessQueue = result.catch(() => {});
    return result;
  };

  const router = new Router();

  const handleWithContext = async (
    ctx: Context,
    body?: unknown
  ): Promise<void> => {
    const authHeader = ctx.headers.authorization ?? '';
    const authToken = authHeader.replace(/^Bearer\s+/i, '');

    const runRequest = async (
      transport: StreamableHTTPServerTransport
    ): Promise<void> => {
      await transport.handleRequest(ctx.req, ctx.res, body);
      // Prevent Koa from sending its own response
      // The MCP SDK has already handled the response
      ctx.respond = false;
    };

    if (isStateful && sharedTransport) {
      // Stateful mode: reuse the shared transport
      if (apiBaseUrl) {
        await requestContextStore.run({ authToken, apiBaseUrl }, () => {
          return runRequest(sharedTransport!);
        });
      } else {
        await runRequest(sharedTransport);
      }
    } else {
      // Stateless mode: SDK requires a fresh transport per request.
      // Serialise so only one transport is connected at a time.
      await enqueueStateless(async () => {
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: undefined,
          enableJsonResponse: true,
        });
        // Connect the server to this per-request transport
        await server.connect(transport);
        try {
          if (apiBaseUrl) {
            await requestContextStore.run({ authToken, apiBaseUrl }, () => {
              return runRequest(transport);
            });
          } else {
            await runRequest(transport);
          }
        } finally {
          // Close the transport to reset the server's internal transport reference,
          // allowing the next request to connect a fresh transport.
          await transport.close();
        }
      });
    }
  };

  router.post(path, async (ctx: Context) => {
    try {
      await handleWithContext(ctx, ctx.request.body);
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
      await handleWithContext(ctx);
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
