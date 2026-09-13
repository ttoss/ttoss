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
   * Per-request factory building the `McpServer` that serves one `2026-07-28`
   * request. Required to serve that revision at all — see
   * {@link createMcpRequestServer} for why the `server` above cannot be used
   * for it.
   */
  createMcpServer?: McpServerFactory;
}

/**
 * Compile-time guard on the classifier's outcome union.
 *
 * The serving function branches on `reject` and `modern` and treats everything
 * else as 2025-era traffic. That fallback is deliberate — see
 * {@link createMcpRequestServer} — but a fourth `kind` added by a future SDK
 * minor still deserves a considered branch rather than silently inheriting it.
 * This alias stops compiling on the day the union grows: its default type
 * argument only satisfies the constraint while `legacy` is the sole remaining
 * kind.
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

/**
 * The JSON-RPC id to echo back in an error answer, mirroring the SDK's own
 * rule: only a request-shaped body — an object naming a `method` — carries an
 * id worth echoing, and only when that id is a string or a number. Everything
 * else is answered with `null`.
 */
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
 * Writes a JSON-RPC error straight to the Node response.
 *
 * The router sets `ctx.respond = false` after serving, because every other
 * branch has already written the response through the SDK — so an answer built
 * here has to be written the same way rather than left on `ctx.body` for Koa.
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
 * The answer to `2026-07-28` traffic on a router configured without
 * `createMcpServer`: the spec's unsupported-protocol-version error, mirroring
 * what the SDK emits for the opposite case (2025-era traffic on a modern-only
 * endpoint). `data.supported` lists the revisions this endpoint does serve, so
 * the client can renegotiate onto one; the message names the option that would
 * make it serve `2026-07-28` instead, since the gap is configuration rather
 * than protocol.
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
 * each request to the protocol revision it actually speaks.
 *
 * Requests are classified once at the boundary with the SDK's own
 * `classifyInboundRequest`, whose outcome is three-way and is branched on as
 * such:
 *
 * - **`kind: 'legacy'`** — 2025-era traffic, which is everything without a
 *   `2026-07-28` per-request envelope and so all traffic from today's MCP
 *   clients. Served over `NodeStreamableHTTPServerTransport` with
 *   `enableJsonResponse: true`, the same wiring and the same plain-JSON
 *   responses this package has always produced.
 * - **`kind: 'reject'`** — the classifier refused the request and handed back
 *   a complete answer (`httpStatus`, `code`, `message`, `data`). It is emitted
 *   verbatim, so the client is told the SDK's reason at the SDK's status
 *   rather than whatever a downstream handler would have made of the request.
 * - **`kind: 'modern'`** — `2026-07-28` traffic, served by `createMcpHandler`
 *   with `legacy: 'reject'` from a **per-request** `McpServer` built by
 *   `createMcpServer`.
 *
 * Anything else — an outcome a future SDK minor adds — is served as 2025-era
 * traffic. For a compatibility shim the safe default is the behaviour that has
 * always worked, not the newest revision; {@link LegacyIsTheOnlyRemainingOutcome}
 * turns that fallback into a compile error the day it starts covering something
 * real.
 *
 * ## Why `2026-07-28` needs its own server instance
 *
 * The negotiated protocol revision is *instance* state on `McpServer`: the SDK
 * marks an instance modern when it serves one modern request, and from then on
 * that instance validates every inbound message against `2026-07-28` — there
 * is no per-request era consult. Serving both eras from the one `server` this
 * package is handed therefore poisons it: a single `2026-07-28` request pins
 * the shared instance to that revision, and every subsequent 2025-era request
 * is answered `-32602 Request is missing the required _meta envelope…` at HTTP
 * 200, for the life of the process. The SDK's serving entries take a factory
 * and call it *per request* for exactly this reason (they also `close()` the
 * instance they were given, which a shared one cannot survive).
 *
 * So the modern path is served only when the consumer supplies
 * `createMcpServer`. Without it, `2026-07-28` requests are answered with the
 * unsupported-protocol-version error naming the 2025-era revisions this
 * endpoint does serve — a clean renegotiation signal for the one client
 * affected, instead of a silent outage for every other client.
 *
 * Splitting on the classifier — instead of letting `createMcpHandler` serve
 * both eras through its built-in legacy fallback — is what keeps 2025-era
 * responses byte-compatible. That fallback constructs its transport with only
 * `sessionIdGenerator: undefined` and no way to pass `enableJsonResponse`, so
 * every response it produces is SSE-framed (`text/event-stream`) regardless of
 * the handler's `responseMode`. Owning the legacy branch keeps `application/json`.
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
