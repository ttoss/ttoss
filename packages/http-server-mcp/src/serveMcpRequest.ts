import {
  NodeStreamableHTTPServerTransport,
  toNodeHandler,
} from '@modelcontextprotocol/node';
import type {
  InboundClassificationOutcome,
  InboundLadderRejection,
  McpServer,
  McpServerFactory,
} from '@modelcontextprotocol/server';
import {
  classifyInboundRequest,
  createMcpHandler,
  ProtocolErrorCode,
  SUPPORTED_PROTOCOL_VERSIONS,
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
  /**
   * Per-request factory for the `McpServer` serving one `2026-07-28` request.
   * Required to serve that revision — see {@link createMcpRequestServer}.
   */
  createMcpServer?: McpServerFactory;
}

/**
 * Stops compiling if the classifier's union grows a fourth `kind`, so the new
 * outcome gets a considered branch instead of inheriting the legacy fallback.
 */
export type LegacyIsTheOnlyRemainingOutcome<
  Remaining extends 'legacy' = Exclude<
    InboundClassificationOutcome['kind'],
    'modern' | 'reject'
  >,
> = Remaining;

/**
 * Reads a header as `string | undefined`. Koa's `ctx.get` returns `''` for a
 * missing header, which the classifier would read as "header present but
 * empty" rather than absent.
 */
const header = (ctx: Context, name: string): string | undefined => {
  const value = ctx.get(name);
  return value === '' ? undefined : value;
};

/** The id to echo in an error answer, by the SDK's own rule. */
const echoableRequestId = (body?: unknown): string | number | null => {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return null;
  }

  const { id, method } = body as { id?: unknown; method?: unknown };

  if (typeof method !== 'string') {
    return null;
  }

  return typeof id === 'string' || typeof id === 'number' ? id : null;
};

/** A JSON-RPC error answer and the HTTP status to emit it with. */
interface JsonRpcErrorAnswer {
  httpStatus: number;
  code: number;
  message: string;
  data?: unknown;
}

/**
 * Writes a JSON-RPC error straight to the Node response: `createMcpRouter` sets
 * `ctx.respond = false` after serving, so Koa never writes `ctx.body`.
 */
const emitJsonRpcError = (
  ctx: Context,
  answer: JsonRpcErrorAnswer,
  body?: unknown
): void => {
  ctx.res.writeHead(answer.httpStatus, {
    'content-type': 'application/json',
  });
  ctx.res.end(
    JSON.stringify({
      jsonrpc: '2.0',
      error: {
        code: answer.code,
        message: answer.message,
        ...(answer.data !== undefined && { data: answer.data }),
      },
      id: echoableRequestId(body),
    })
  );
};

/** The SDK's own ladder rejection, emitted with the status the SDK chose. */
const rejectionAnswer = (
  rejection: InboundLadderRejection
): JsonRpcErrorAnswer => {
  return {
    httpStatus: rejection.httpStatus,
    code: rejection.code,
    message: rejection.message,
    ...(rejection.data !== undefined && { data: rejection.data }),
  };
};

/**
 * The answer to `2026-07-28` traffic without `createMcpServer`. `data.supported`
 * is what lets the client renegotiate onto a revision this endpoint serves.
 */
const REVISION_NOT_SERVED_ANSWER: JsonRpcErrorAnswer = {
  httpStatus: 400,
  code: ProtocolErrorCode.UnsupportedProtocolVersion,
  message:
    'Unsupported protocol version: this endpoint serves the 2025-era MCP ' +
    'revisions only. Pass createMcpServer to createMcpRouter to serve ' +
    'protocol revision 2026-07-28.',
  data: { supported: [...SUPPORTED_PROTOCOL_VERSIONS] },
};

/**
 * Builds the per-request serving function used by `createMcpRouter`, routing
 * each request by the SDK's three-way `classifyInboundRequest` outcome.
 *
 * **Why the modern era needs `createMcpServer` rather than the `server` above.**
 * The negotiated revision is *instance* state: the SDK marks an instance modern
 * when it serves one modern request, and it then validates every later message
 * against `2026-07-28` — there is no per-request era consult. One instance
 * serving both eras is therefore pinned by the first client to speak the newer
 * revision, after which every 2025-era request is answered `-32602 Request is
 * missing the required _meta envelope…` at HTTP 200 for the life of the
 * process. The SDK's own entries take a factory and call it per request for
 * this reason (they also `close()` the instance, which a shared one cannot
 * survive). Without the factory, `2026-07-28` traffic gets
 * {@link REVISION_NOT_SERVED_ANSWER} and no other client is affected.
 *
 * **Why not `createMcpHandler`'s built-in legacy fallback.** It constructs its
 * transport with no way to pass `enableJsonResponse`, so every response it
 * produces is SSE-framed. Owning the legacy branch keeps `application/json`.
 */
export const createMcpRequestServer = ({
  createMcpServer,
  server,
  sessionIdGenerator,
}: CreateMcpRequestServerParams): ((
  ctx: Context,
  body?: unknown
) => Promise<void>) => {
  const isStateful = sessionIdGenerator !== undefined;

  const modernHandler = createMcpServer
    ? toNodeHandler(createMcpHandler(createMcpServer, { legacy: 'reject' }))
    : undefined;

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

  return async (ctx: Context, body?: unknown): Promise<void> => {
    const outcome = classifyInboundRequest({
      httpMethod: ctx.method,
      protocolVersionHeader: header(ctx, 'mcp-protocol-version'),
      mcpMethodHeader: header(ctx, 'mcp-method'),
      mcpNameHeader: header(ctx, 'mcp-name'),
      body,
    });

    if (outcome.kind === 'reject') {
      emitJsonRpcError(ctx, rejectionAnswer(outcome), body);
      return;
    }

    if (outcome.kind === 'modern') {
      if (modernHandler === undefined) {
        emitJsonRpcError(ctx, REVISION_NOT_SERVED_ANSWER, body);
        return;
      }

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
