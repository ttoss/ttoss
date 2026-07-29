import {
  NodeStreamableHTTPServerTransport,
  toNodeHandler,
} from '@modelcontextprotocol/node';
import type { McpServer } from '@modelcontextprotocol/server';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports -- value imports required; both are called at runtime
import {
  classifyInboundRequest,
  createMcpHandler,
} from '@modelcontextprotocol/server';
import type Koa from 'koa';

type Context = Koa.Context;

/** Parameters for {@link createMcpRequestServer}. */
export interface CreateMcpRequestServerParams {
  /** The MCP server instance whose tools and resources are being served. */
  server: McpServer;
  /**
   * When provided, 2025-era traffic is served statefully through a single
   * shared transport connected once, rather than a fresh transport per request.
   */
  sessionIdGenerator?: () => string;
}

/**
 * Reads a header as `string | undefined`. Koa's `ctx.get` returns `''` for a
 * missing header, which the classifier would read as "header present but
 * empty" rather than absent.
 */
const header = (ctx: Context, name: string): string | undefined => {
  const value = ctx.get(name);
  return value === '' ? undefined : value;
};

/**
 * Builds the per-request serving function used by `createMcpRouter`, routing
 * each request to the protocol revision it actually speaks.
 *
 * Requests are classified once at the boundary with the SDK's own
 * `classifyInboundRequest`:
 *
 * - **2025-era traffic** (everything without a `2026-07-28` per-request
 *   envelope — which is all traffic from today's MCP clients) is served over
 *   `NodeStreamableHTTPServerTransport` with `enableJsonResponse: true`, the
 *   same wiring and the same plain-JSON responses this package has always
 *   produced.
 * - **`2026-07-28` traffic** is served by `createMcpHandler` with
 *   `legacy: 'reject'`, so the modern revision is handled by the SDK's
 *   stateless core rather than the transport above. Malformed requests are
 *   routed here too, so the SDK emits its own spec-defined rejection instead of
 *   this package inventing one.
 *
 * Splitting on the classifier — instead of letting `createMcpHandler` serve
 * both eras through its built-in legacy fallback — is what keeps 2025-era
 * responses byte-compatible. That fallback constructs its transport with only
 * `sessionIdGenerator: undefined` and no way to pass `enableJsonResponse`, so
 * every response it produces is SSE-framed (`text/event-stream`) regardless of
 * the handler's `responseMode`. Owning the legacy branch keeps `application/json`.
 */
export const createMcpRequestServer = ({
  server,
  sessionIdGenerator,
}: CreateMcpRequestServerParams): ((
  ctx: Context,
  body?: unknown
) => Promise<void>) => {
  const isStateful = sessionIdGenerator !== undefined;

  const modernHandler = toNodeHandler(
    createMcpHandler(
      () => {
        return server;
      },
      { legacy: 'reject' }
    )
  );

  // Stateful mode: single shared transport connected once at startup.
  let sharedTransport: NodeStreamableHTTPServerTransport | undefined;
  if (isStateful) {
    sharedTransport = new NodeStreamableHTTPServerTransport({
      sessionIdGenerator,
      enableJsonResponse: true,
    });
    server.connect(sharedTransport);
  }

  // Stateless mode requires a fresh transport per request, and closing one
  // while another is mid-flight on the same `McpServer` deadlocks — so
  // requests are serialised, keeping exactly one stateless transport connected
  // at a time. Only the legacy branch needs this; the modern handler builds its
  // own request-scoped serving unit per exchange and runs fully concurrently.
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

  const isLegacy = (ctx: Context, body?: unknown): boolean => {
    return (
      classifyInboundRequest({
        httpMethod: ctx.method,
        protocolVersionHeader: header(ctx, 'mcp-protocol-version'),
        mcpMethodHeader: header(ctx, 'mcp-method'),
        mcpNameHeader: header(ctx, 'mcp-name'),
        body,
      }).kind === 'legacy'
    );
  };

  return async (ctx: Context, body?: unknown): Promise<void> => {
    if (!isLegacy(ctx, body)) {
      await modernHandler(ctx.req, ctx.res, body);
      return;
    }

    if (sharedTransport) {
      await sharedTransport.handleRequest(ctx.req, ctx.res, body);
      return;
    }

    await enqueueStateless(async () => {
      const transport = new NodeStreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
      });
      // Connect and run inside try/finally so the transport is always closed,
      // even if connect() throws — preventing server state corruption.
      try {
        await server.connect(transport);
        await transport.handleRequest(ctx.req, ctx.res, body);
      } finally {
        // Close the transport to reset the server's internal transport
        // reference, allowing the next request to connect a fresh transport.
        await transport.close();
      }
    });
  };
};
