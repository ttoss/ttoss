import crypto from 'node:crypto';

import { hashApiToken, verifyJwt } from '@ttoss/auth-core';
import type { Context, Next } from '@ttoss/http-server';

import { isOriginAllowed } from './origin';
import type {
  ApiTokenOptions,
  AuthenticatedUser,
  AuthMiddlewareOptions,
  AuthStrategy,
  JwtOptions,
  OAuthOptions,
  SystemOptions,
} from './types';

const tryJwt = (
  token: string,
  opts: JwtOptions,
  ctx: Context
): AuthenticatedUser | null => {
  const payload = verifyJwt({ token, secret: opts.secret });
  if (!payload) return null;
  if (opts.mapPayload)
    return opts.mapPayload(payload as Record<string, unknown>, ctx);
  return {
    id: String(payload.sub ?? ''),
    ...(payload.email !== undefined && { email: String(payload.email) }),
  } as AuthenticatedUser;
};

const tryApiToken = async (
  token: string,
  opts: ApiTokenOptions,
  ctx: Context
): Promise<AuthenticatedUser | null> => {
  return opts.lookup(hashApiToken(token), ctx);
};

const trySystem = (
  token: string,
  opts: SystemOptions
): AuthenticatedUser | null => {
  const a = Buffer.from(token);
  const b = Buffer.from(opts.secret);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return opts.user;
};

/** Sentinel: token verified but missing a required scope → 403, not 401. */
const FORBIDDEN = Symbol('forbidden');

/**
 * Derives a space-separated scope string from the payload.
 * Accepts either `scope: string` (standard JWT claim) or `scopes: string[]`
 * (a common alternative shape). Returns `null` when neither is present.
 */
const resolveScopeString = (
  payload: Record<string, unknown>
): string | null => {
  if (typeof payload.scope === 'string') return payload.scope;
  if (
    Array.isArray(payload.scopes) &&
    payload.scopes.every((s) => {
      return typeof s === 'string';
    })
  ) {
    return (payload.scopes as string[]).join(' ');
  }
  return null;
};

const hasRequiredScopes = (
  requiredScopes: string[],
  payload: Record<string, unknown>
): boolean => {
  const scopeString = resolveScopeString(payload);
  if (scopeString === null) {
    return false;
  }
  const tokenScopes = scopeString ? scopeString.split(' ') : [];
  return requiredScopes.every((s) => {
    return tokenScopes.includes(s);
  });
};

const tryOauth = async (
  token: string,
  opts: OAuthOptions,
  ctx: Context
): Promise<AuthenticatedUser | typeof FORBIDDEN | null> => {
  let payload: Record<string, unknown> | null;
  try {
    payload = await opts.verify(token, ctx);
  } catch {
    return null;
  }
  if (!payload) return null;
  if (
    opts.requiredScopes?.length &&
    !hasRequiredScopes(opts.requiredScopes, payload)
  ) {
    return FORBIDDEN;
  }
  if (opts.mapPayload) return opts.mapPayload(payload, ctx);
  return { id: String(payload.sub ?? ''), ...payload } as AuthenticatedUser;
};

const resolveStrategy = async (
  strategy: AuthStrategy,
  token: string,
  options: AuthMiddlewareOptions,
  ctx: Context
): Promise<AuthenticatedUser | typeof FORBIDDEN | null> => {
  if (strategy === 'jwt' && options.jwt) {
    return tryJwt(token, options.jwt, ctx);
  }
  if (strategy === 'apiToken' && options.apiToken) {
    return tryApiToken(token, options.apiToken, ctx);
  }
  if (strategy === 'system' && options.system) {
    return trySystem(token, options.system);
  }
  if (strategy === 'oauth' && options.oauth) {
    return tryOauth(token, options.oauth, ctx);
  }
  return null;
};

const resolveUser = async (
  token: string,
  options: AuthMiddlewareOptions,
  ctx: Context
): Promise<
  { user: AuthenticatedUser; strategy: string } | typeof FORBIDDEN | null
> => {
  for (const strategy of options.strategies) {
    const result = await resolveStrategy(strategy, token, options, ctx);
    if (result === FORBIDDEN) return FORBIDDEN;
    if (result) return { user: result, strategy };
  }
  return null;
};

/** Throws 403 when an `allowedOrigins` list is set and the Origin doesn't match. */
const enforceOrigin = (
  ctx: Context,
  allowedOrigins: AuthMiddlewareOptions['allowedOrigins']
): void => {
  if (!allowedOrigins) return;
  const origin = ctx.get('Origin');
  if (origin && !isOriginAllowed(origin, allowedOrigins)) {
    ctx.throw(403, 'Invalid origin');
  }
};

/** Extracts the Bearer token from the Authorization header, or `null`. */
const extractBearer = (ctx: Context): string | null => {
  const authHeader = ctx.get('Authorization');
  return authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;
};

/**
 * Koa middleware that authenticates requests via Bearer token. Supports JWT,
 * hashed API tokens, a shared system secret, and OAuth provider tokens (the
 * `oauth` strategy — the resource-server role). Sets `ctx.state.user` and
 * `ctx.state.authStrategy` on success; emits `401` (with a `WWW-Authenticate`
 * header, RFC 9728 when `resourceMetadataUrl` is set) for missing/invalid
 * tokens, and `403` when a verified token is missing a required scope.
 */
export const authMiddleware = (options: AuthMiddlewareOptions) => {
  const required = options.required ?? true;
  const wwwAuthenticate = options.resourceMetadataUrl
    ? `Bearer resource_metadata="${options.resourceMetadataUrl}"`
    : 'Bearer';
  const unauthorized = { headers: { 'WWW-Authenticate': wwwAuthenticate } };

  return async (ctx: Context, next: Next): Promise<void> => {
    enforceOrigin(ctx, options.allowedOrigins);

    const token = extractBearer(ctx);

    if (!token) {
      if (required) ctx.throw(401, 'Unauthorized', unauthorized);
      return next();
    }

    const result = await resolveUser(token, options, ctx);

    if (result === FORBIDDEN) {
      ctx.throw(403, 'Forbidden');
    }

    if (!result) {
      if (required) ctx.throw(401, 'Unauthorized', unauthorized);
      return next();
    }

    ctx.state.user = result.user;
    ctx.state.authStrategy = result.strategy;
    return next();
  };
};
