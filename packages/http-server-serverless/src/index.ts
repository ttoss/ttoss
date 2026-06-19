import type { App } from '@ttoss/http-server';
import serverless from 'serverless-http';

type GatewayEvent = Record<string, unknown> | null | undefined;

const buildV1RawHeaders = (multiValueHeaders: Record<string, string[]>) => {
  const raw: string[] = [];
  for (const [key, values] of Object.entries(multiValueHeaders)) {
    for (const v of values) raw.push(key, v);
  }
  return raw;
};

const buildV2RawHeaders = (
  headers: Record<string, unknown>,
  cookies: string[]
) => {
  const raw: string[] = [];
  for (const [key, value] of Object.entries(headers)) {
    if (value !== undefined) raw.push(key, String(value));
  }
  for (const cookie of cookies) raw.push('cookie', cookie);
  return raw;
};

/**
 * Build a flat `rawHeaders` array from an API Gateway event so that
 * `@hono/node-server`'s `newHeadersFromIncoming` can read all headers.
 *
 * Supports API Gateway REST (v1) `multiValueHeaders` and HTTP API (v2)
 * `headers` + `cookies` event shapes.
 */
export const buildRawHeaders = (event: unknown): string[] => {
  const ev = event as GatewayEvent;
  if (ev?.multiValueHeaders) {
    return buildV1RawHeaders(ev.multiValueHeaders as Record<string, string[]>);
  }
  return buildV2RawHeaders(
    (ev?.headers as Record<string, unknown>) ?? {},
    (ev?.cookies as string[]) ?? []
  );
};

/**
 * Wrap a `@ttoss/http-server` `App` in an AWS Lambda handler.
 *
 * Compared to using `serverless-http` directly, this adapter populates
 * `req.rawHeaders` from the original API Gateway event headers before the
 * request reaches the application. That is required because
 * `@hono/node-server` (used internally by `@ttoss/http-server-mcp`) builds
 * Web `Request` headers exclusively from `req.rawHeaders` — which
 * `serverless-http` leaves empty — causing every header to be dropped and
 * MCP `initialize` requests to fail with HTTP 406.
 */
export const toLambdaHandler = (app: App) => {
  return serverless(app.callback(), {
    request: (req: Record<string, unknown>, event: unknown) => {
      const rawHeaders = req.rawHeaders as string[] | undefined;
      if (!rawHeaders?.length) req.rawHeaders = buildRawHeaders(event);
    },
  });
};
