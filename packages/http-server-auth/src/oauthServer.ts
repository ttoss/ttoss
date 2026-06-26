import {
  createOAuthHandlers,
  type OAuthRequest,
  type OAuthResponse,
  type OAuthServerOptions,
} from '@ttoss/auth-core';
import { type Context, type Middleware, Router } from '@ttoss/http-server';

/**
 * The OAuth authorization-server option types and runner-agnostic engine live
 * in `@ttoss/auth-core`; these are the Koa adapters that mount it on an
 * `@ttoss/http-server` app. Re-exported so a consumer needs a single import.
 */
export {
  type AuthCodeStore,
  type AuthorizeRequest,
  type ClientStore,
  createOAuthHandlers,
  getWwwAuthenticateHeader,
  type IssuedTokens,
  type IssueTokensArgs,
  type OAuthClient,
  type OAuthClientMetadata,
  type OAuthHandlers,
  type OAuthServerOptions,
  type OnAuthorizeArgs,
  type OnAuthorizeResult,
  type OnRefreshTokenArgs,
  type OnRefreshTokenResult,
  type StoredAuthorizationCode,
} from '@ttoss/auth-core';

/** Normalizes a Koa query/header value (which may be an array) to a string. */
const firstValue = (
  value: string | string[] | undefined
): string | undefined => {
  return Array.isArray(value) ? value[0] : value;
};

const toOAuthRequest = (ctx: Context): OAuthRequest => {
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

const applyResponse = (ctx: Context, res: OAuthResponse): void => {
  if (res.redirect !== undefined) {
    ctx.redirect(res.redirect);
    return;
  }
  ctx.status = res.status;
  ctx.body = res.body;
};

/**
 * Mounts an OAuth 2.1 Authorization Server (issuing tokens) as a Koa `Router`,
 * adapting the runner-agnostic engine from `@ttoss/auth-core`. Exposes the
 * authorization endpoint (PKCE S256), token endpoint (`authorization_code` +
 * `refresh_token`), Dynamic Client Registration, and discovery metadata.
 *
 * This is the issuing side of OAuth; pair it with `authMiddleware`'s `oauth`
 * strategy (the verifying side) when one deployment both issues and verifies.
 *
 * @example
 * ```typescript
 * import { App, bodyParser } from '@ttoss/http-server';
 * import { oauthServer } from '@ttoss/http-server-auth';
 *
 * const app = new App();
 * app.use(bodyParser());
 * app.use(oauthServer({ issuer, clientStore, authCodeStore, issueTokens, onAuthorize }).routes());
 * ```
 */
export const oauthServer = (options: OAuthServerOptions): Router => {
  const engine = createOAuthHandlers(options);
  const router = new Router();

  router.get('/.well-known/oauth-authorization-server', (ctx: Context) => {
    applyResponse(ctx, engine.authorizationServerMetadata());
  });

  const prm = engine.protectedResourceMetadata();
  if (prm) {
    router.get('/.well-known/oauth-protected-resource', (ctx: Context) => {
      applyResponse(ctx, prm);
    });
  }

  router.get(engine.paths.authorize, async (ctx: Context) => {
    applyResponse(ctx, await engine.authorize(toOAuthRequest(ctx)));
  });

  router.post(engine.paths.token, async (ctx: Context) => {
    applyResponse(ctx, await engine.token(toOAuthRequest(ctx)));
  });

  router.post(engine.paths.register, async (ctx: Context) => {
    applyResponse(ctx, await engine.register(toOAuthRequest(ctx)));
  });

  return router;
};

/**
 * Koa middleware that serves `GET /.well-known/oauth-protected-resource`
 * (RFC 9728). Mount it **before** `authMiddleware` so the discovery endpoint
 * stays unauthenticated (clients fetch it before they have a token).
 */
export const createProtectedResourceMetadataMiddleware = (args: {
  /** The protected resource's identifier URI. */
  resource: string;
  /** Authorization server issuer URIs that issue tokens for this resource. */
  authorizationServers: string[];
}): Middleware => {
  return async (ctx: Context, next) => {
    if (
      ctx.method === 'GET' &&
      ctx.path === '/.well-known/oauth-protected-resource'
    ) {
      ctx.body = {
        resource: args.resource,
        authorization_servers: args.authorizationServers,
      };
      return;
    }
    await next();
  };
};
