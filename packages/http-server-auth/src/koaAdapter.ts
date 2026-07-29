import type { AuthHttpRequest, AuthHttpResponse } from '@ttoss/auth-core';
import type { Context } from '@ttoss/http-server';

/**
 * Translation between Koa's `ctx` and the framework-agnostic request/response
 * shapes the `@ttoss/auth-core` engines speak. Shared by every adapter in this
 * package so the mapping exists once.
 */

/** Normalizes a Koa query/header value (which may be an array) to a string. */
export const firstValue = (
  value: string | string[] | undefined
): string | undefined => {
  return Array.isArray(value) ? value[0] : value;
};

export const toAuthRequest = (ctx: Context): AuthHttpRequest => {
  const query: Record<string, string | undefined> = {};

  for (const [key, value] of Object.entries(ctx.query)) {
    query[key] = firstValue(value);
  }

  const headers: Record<string, string | undefined> = {};

  for (const [key, value] of Object.entries(ctx.headers)) {
    headers[key] = firstValue(value);
  }

  return {
    query,
    body: (ctx.request.body ?? {}) as Record<string, unknown>,
    headers,
  };
};

/**
 * Applies an engine response to `ctx`. A response carries either a JSON body
 * with a status or a redirect, never both.
 */
export const applyResponse = (ctx: Context, res: AuthHttpResponse): void => {
  if (res.redirect !== undefined) {
    ctx.redirect(res.redirect);
    return;
  }

  ctx.status = res.status;
  ctx.body = res.body;
};
