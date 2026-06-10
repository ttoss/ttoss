import crypto from 'node:crypto';

import { hashApiToken, verifyJwt } from '@ttoss/auth-core';
import type { Context, Next } from '@ttoss/http-server';

import { isOriginAllowed } from './origin';
import type {
  ApiTokenOptions,
  AuthenticatedUser,
  AuthMiddlewareOptions,
  JwtOptions,
  SystemOptions,
} from './types';

const tryJwt = (token: string, opts: JwtOptions): AuthenticatedUser | null => {
  const payload = verifyJwt({ token, secret: opts.secret });
  if (!payload) return null;
  if (opts.mapPayload)
    return opts.mapPayload(payload as Record<string, unknown>);
  return {
    id: String(payload.sub ?? ''),
    ...(payload.email !== undefined && { email: String(payload.email) }),
  } as AuthenticatedUser;
};

const tryApiToken = async (
  token: string,
  opts: ApiTokenOptions
): Promise<AuthenticatedUser | null> => {
  return opts.lookup(hashApiToken(token));
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

const resolveUser = async (
  token: string,
  options: AuthMiddlewareOptions
): Promise<{ user: AuthenticatedUser; strategy: string } | null> => {
  for (const strategy of options.strategies) {
    let user: AuthenticatedUser | null = null;

    if (strategy === 'jwt' && options.jwt) {
      user = tryJwt(token, options.jwt);
    } else if (strategy === 'apiToken' && options.apiToken) {
      user = await tryApiToken(token, options.apiToken);
    } else if (strategy === 'system' && options.system) {
      user = trySystem(token, options.system);
    }

    if (user) return { user, strategy };
  }
  return null;
};

/**
 * Koa middleware that authenticates requests via Bearer token.
 * Supports JWT, hashed API tokens, and a shared system secret.
 * Sets `ctx.state.user` and `ctx.state.authStrategy` on success.
 */
export const authMiddleware = (options: AuthMiddlewareOptions) => {
  const required = options.required ?? true;

  return async (ctx: Context, next: Next): Promise<void> => {
    if (options.allowedOrigins) {
      const origin = ctx.get('Origin');
      if (origin && !isOriginAllowed(origin, options.allowedOrigins)) {
        ctx.throw(403, 'Invalid origin');
      }
    }

    const authHeader = ctx.get('Authorization');
    const token =
      authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : null;

    if (!token) {
      if (required) ctx.throw(401, 'Unauthorized');
      return next();
    }

    const result = await resolveUser(token, options);

    if (!result) {
      if (required) ctx.throw(401, 'Unauthorized');
      return next();
    }

    ctx.state.user = result.user;
    ctx.state.authStrategy = result.strategy;
    return next();
  };
};
