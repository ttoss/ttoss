import type { Context } from 'koa';

/**
 * A deliberate, client-facing HTTP error normalized out of an unknown thrown
 * value — what `ctx.throw(401, 'Unauthorized', { headers })` produces.
 */
export interface NormalizedHttpError {
  /** The 4xx status the thrower asked for. */
  status: number;
  /** The message the thrower attached, safe to expose to the client. */
  message: string;
  /**
   * Headers the thrower attached to the error (a `401`'s `WWW-Authenticate`,
   * for instance). Empty when the error carried none.
   */
  headers: Record<string, string>;
}

/**
 * The shape `http-errors` (used by Koa's `ctx.throw`) puts on a thrown error.
 * Every field is `unknown` because the value reaching a catch-all error
 * middleware is genuinely untyped.
 */
interface HttpishError {
  status?: unknown;
  statusCode?: unknown;
  expose?: unknown;
  headers?: unknown;
  message?: unknown;
}

const DEFAULT_MESSAGE = 'The request could not be completed.';

const readStatus = (candidate: HttpishError): number | undefined => {
  const raw = candidate.status ?? candidate.statusCode;
  return typeof raw === 'number' ? raw : undefined;
};

const readHeaders = (candidate: HttpishError): Record<string, string> => {
  const { headers } = candidate;

  if (typeof headers !== 'object' || headers === null) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(headers).filter(([, value]) => {
      return typeof value === 'string';
    })
  ) as Record<string, string>;
};

/**
 * Normalizes an error thrown by a library middleware — `authMiddleware`,
 * `createMcpRouter`'s `auth`, or any `ctx.throw` — into the status, message,
 * and headers a catch-all error middleware must preserve.
 *
 * An app with its own error envelope typically recognizes only its own error
 * class and turns everything else into a `500`. That swallows a deliberate
 * `401` **and its `WWW-Authenticate` header**, which is the whole RFC 9728
 * discovery chain for MCP clients: the client gets an opaque server error where
 * it expected the pointer to the authorization server, so OAuth discovery never
 * starts. Run thrown values through this helper before falling back to `500`.
 *
 * Returns `undefined` for anything that is not a deliberate, exposable 4xx —
 * a genuine bug still becomes a `500` with nothing leaked. Only errors that opt
 * in via `expose === true` (which `http-errors` sets for 4xx) pass through.
 *
 * @example
 * ```typescript
 * import { applyHttpErrorHeaders, toHttpError } from '@ttoss/http-server';
 *
 * app.use(async (ctx, next) => {
 *   try {
 *     await next();
 *   } catch (error) {
 *     if (error instanceof ApiError) {
 *       writeError(ctx, error);
 *       return;
 *     }
 *
 *     const httpError = toHttpError(error);
 *
 *     if (httpError) {
 *       applyHttpErrorHeaders({ ctx, error });
 *       writeError(ctx, new ApiError(httpError.status, httpError.message));
 *       return;
 *     }
 *
 *     console.error('Unhandled request error:', error);
 *     writeError(ctx, new ApiError(500, 'internal_error'));
 *   }
 * });
 * ```
 */
export const toHttpError = (
  error: unknown
): NormalizedHttpError | undefined => {
  if (typeof error !== 'object' || error === null) {
    return undefined;
  }

  const candidate = error as HttpishError;
  const status = readStatus(candidate);

  if (status === undefined || status < 400 || status >= 500) {
    return undefined;
  }

  /**
   * `http-errors` sets `expose: true` on 4xx and `false` on 5xx. Gating on it
   * keeps internal failure details out of responses, even when an internal
   * error happens to carry a 4xx-looking status.
   */
  if (candidate.expose !== true) {
    return undefined;
  }

  const message =
    typeof candidate.message === 'string' && candidate.message
      ? candidate.message
      : DEFAULT_MESSAGE;

  return { status, message, headers: readHeaders(candidate) };
};

/**
 * Copies the headers a thrower attached to an error onto the response — the
 * `WWW-Authenticate` header of a `401`, above all.
 *
 * Call it from a catch-all error middleware alongside {@link toHttpError}:
 * without this half the status is right but MCP discovery is still broken,
 * because the header that names the authorization server never reaches the
 * client. Non-string header values are ignored; a value that is not an error
 * object, or an error without headers, is a no-op.
 */
export const applyHttpErrorHeaders = ({
  ctx,
  error,
}: {
  /** The Koa context whose response headers are being written. */
  ctx: Context;
  /** The caught value, of unknown shape. */
  error: unknown;
}): void => {
  if (typeof error !== 'object' || error === null) {
    return;
  }

  for (const [name, value] of Object.entries(
    readHeaders(error as HttpishError)
  )) {
    ctx.set(name, value);
  }
};
