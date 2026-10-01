import {
  IncomingMessage,
  type OutgoingHttpHeaders,
  ServerResponse,
  STATUS_CODES,
} from 'node:http';
import { Socket } from 'node:net';

import type App from 'koa';

export type InProcessRequest = {
  /** The HTTP method, in any case. */
  method: string;
  /** The path plus any query string, e.g. `/api/v1/items?limit=10`. */
  path: string;
  /** Request headers. An `undefined` value is left out. */
  headers?: Record<string, string | undefined>;
  /** The request body, sent as JSON. `undefined` sends none. */
  body?: unknown;
};

export type InProcessResponse = {
  status: number;
  headers: OutgoingHttpHeaders;
  /**
   * The body as a client would read it: a JSON body is round-tripped through
   * `JSON.stringify`, so a `Date` arrives as its ISO string, and a `Buffer` as
   * UTF-8 text. `undefined` when the response has none.
   */
  body: unknown;
};

// The statuses Koa answers with no body at all.
const EMPTY_STATUSES = new Set([204, 205, 304]);

// `Host` is mandatory in HTTP/1.1 and middleware may read it, so it is set
// rather than left absent.
const DEFAULT_HOST = 'localhost';

// A real `IncomingMessage` on a real, unconnected socket rather than a
// duck-typed stand-in: Koa and its middleware reach into `req.socket`,
// `req.headers` and the raw stream, and a hand-shaped object would have to
// keep pace with all of them.
const buildRequest = ({
  method,
  path,
  headers = {},
  body,
}: InProcessRequest): IncomingMessage => {
  const req = new IncomingMessage(new Socket());

  req.method = method.toUpperCase();
  req.url = path;
  req.httpVersion = '1.1';
  req.httpVersionMajor = 1;
  req.httpVersionMinor = 1;

  const resolved: Record<string, string> = { host: DEFAULT_HOST };

  for (const [name, value] of Object.entries(headers)) {
    if (value !== undefined) {
      resolved[name.toLowerCase()] = value;
    }
  }

  const payload =
    body === undefined ? undefined : Buffer.from(JSON.stringify(body), 'utf8');

  if (payload) {
    resolved['content-type'] ??= 'application/json';
    resolved['content-length'] = String(payload.byteLength);
    req.push(payload);
  }

  req.headers = resolved;
  req.push(null);

  return req;
};

const isStream = (body: object): boolean => {
  return typeof (body as { pipe?: unknown }).pipe === 'function';
};

// One in-memory round trip, so what this returns is what the socket would
// have carried: the live `ctx.body` would hand back a `Date` where the wire
// has an ISO string, and alias an object the handler still holds.
const toWireBody = (body: unknown): unknown => {
  if (body === undefined || body === null) {
    return undefined;
  }

  if (Buffer.isBuffer(body)) {
    return body.toString('utf8');
  }

  if (typeof body !== 'object') {
    return body;
  }

  if (isStream(body)) {
    throw new TypeError(
      '@ttoss/http-server: dispatchInProcess cannot read a streamed response body.'
    );
  }

  return JSON.parse(JSON.stringify(body));
};

type HttpLikeError = Error & {
  status?: unknown;
  statusCode?: unknown;
  expose?: boolean;
};

// What Koa's own `ctx.onerror` answers for an error that escapes the
// middleware: its status when it carries a valid one, and its message only
// when it is marked safe to expose.
const errorResponse = (error: HttpLikeError) => {
  const candidate = error.status ?? error.statusCode;

  const status =
    typeof candidate === 'number' && candidate >= 400 && candidate < 600
      ? candidate
      : 500;

  return {
    status,
    body: error.expose ? error.message : STATUS_CODES[status],
  };
};

/**
 * Serves one request against a Koa app in this process, with no socket and no
 * port: the app's whole middleware chain runs, exactly as it would for a
 * request that arrived over the network.
 *
 * Useful when one surface of an application calls another — an MCP tool
 * dispatching to the REST route it was generated from — without a second
 * implementation of validation, authorization or error handling, and without
 * a loopback request to the process's own port.
 *
 * An error that escapes the middleware answers as Koa would answer it (its
 * `status`, or 500) and is emitted on the app's `error` event when it has a
 * listener.
 */
export const dispatchInProcess = async ({
  app,
  ...request
}: InProcessRequest & { app: App }): Promise<InProcessResponse> => {
  const req = buildRequest(request);
  const ctx = app.createContext(req, new ServerResponse(req));

  // Koa's own `handleRequest` seeds this, so an unmatched route answers 404
  // rather than a `ServerResponse`'s default of 200.
  ctx.res.statusCode = 404;

  // Koa 3 keeps the composer it was built with on `app.compose` (the one its
  // own `callback()` uses); the typings do not declare it.
  const { compose } = app as unknown as {
    compose: (
      middleware: App['middleware']
    ) => (context: unknown) => Promise<void>;
  };

  try {
    await compose(app.middleware)(ctx);
  } catch (error) {
    if (app.listenerCount('error') > 0) {
      app.emit('error', error, ctx);
    }

    return {
      ...errorResponse(error as HttpLikeError),
      headers: {},
    };
  }

  // Koa's `respond` writes the status message when a response has no body and
  // its status allows one — an unmatched route reaches the client as
  // `Not Found` — so the same is answered here.
  const bodyless =
    (ctx.body === undefined || ctx.body === null) &&
    !EMPTY_STATUSES.has(ctx.status);

  return {
    status: ctx.status,
    headers: { ...ctx.response.headers },
    body: bodyless ? ctx.message || String(ctx.status) : toWireBody(ctx.body),
  };
};
