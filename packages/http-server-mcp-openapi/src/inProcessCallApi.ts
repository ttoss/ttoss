import {
  type App,
  dispatchInProcess,
  type InProcessResponse,
} from '@ttoss/http-server';

import type { ResolvedRequest } from './registerOpenApiTools';

export interface CreateInProcessCallApiArgs {
  /**
   * The Koa app serving the REST API the tools were generated from, or a
   * function returning it — for an app that mounts the MCP router itself and
   * so is not built yet when the tools are registered.
   */
  app: App | (() => App | Promise<App>);
  /**
   * Headers added to every dispatched request, after the ones the MCP request
   * carried — e.g. a marker that tells a request log the call came from a tool.
   */
  headers?: (request: ResolvedRequest) => Record<string, string | undefined>;
  /**
   * Builds the error a non-2xx response throws. The default reads the message
   * out of the common error envelopes (see {@link errorMessageOf}).
   */
  toError?: (response: InProcessResponse, request: ResolvedRequest) => Error;
}

// `{ code, message }`, the envelope most of these APIs nest under `error`.
const nestedMessageOf = (error: unknown): string | null => {
  if (!error || typeof error !== 'object') {
    return null;
  }

  const { code, message } = error as { code?: unknown; message?: unknown };

  if (typeof message !== 'string') {
    return null;
  }

  return typeof code === 'string' ? `${code}: ${message}` : message;
};

/**
 * The message an error response carries, read from the envelopes REST APIs
 * commonly answer with: a plain string, `{ error: '…' }`,
 * `{ error: { code, message } }` (as `code: message`) or `{ message: '…' }`.
 * `null` when the body is none of them.
 */
export const errorMessageOf = (body: unknown): string | null => {
  if (typeof body === 'string') {
    return body || null;
  }

  if (!body || typeof body !== 'object') {
    return null;
  }

  const { error, message } = body as { error?: unknown; message?: unknown };

  if (typeof error === 'string') {
    return error;
  }

  return (
    nestedMessageOf(error) ?? (typeof message === 'string' ? message : null)
  );
};

const defaultToError = (response: InProcessResponse): Error => {
  return new Error(errorMessageOf(response.body) ?? `HTTP ${response.status}`);
};

/**
 * A `callApi` for {@link registerOpenApiTools} that serves each tool call
 * against the REST app in this same process, with no socket: validation,
 * authorization and error handling run once, in the routes, for both
 * surfaces.
 *
 * The MCP request's headers (what `createMcpRouter`'s `getApiHeaders`
 * produced — typically the caller's `Authorization`) are forwarded onto the
 * dispatched request. A 2xx answers its body; anything else throws, so the
 * client sees a tool error rather than an error body rendered as a result.
 *
 * @example
 * ```typescript
 * registerOpenApiTools({
 *   server,
 *   spec,
 *   callApi: createInProcessCallApi({ app }),
 * });
 * ```
 */
export const createInProcessCallApi = ({
  app,
  headers,
  toError = defaultToError,
}: CreateInProcessCallApiArgs): ((
  request: ResolvedRequest
) => Promise<unknown>) => {
  return async (request) => {
    const target = typeof app === 'function' ? await app() : app;

    const response = await dispatchInProcess({
      app: target,
      method: request.method,
      path: request.url,
      headers: { ...request.headers, ...headers?.(request) },
      body: request.body,
    });

    if (response.status < 200 || response.status >= 300) {
      throw toError(response, request);
    }

    return response.body;
  };
};
