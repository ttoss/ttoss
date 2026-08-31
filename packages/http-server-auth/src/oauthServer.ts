import {
  createOAuthHandlers,
  type OAuthServerOptions,
  protectedResourceMetadataDocument,
  protectedResourceMetadataPaths,
} from '@ttoss/auth-core';
import { type Context, type Middleware, Router } from '@ttoss/http-server';

import { applyResponse, toAuthRequest } from './koaAdapter';

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
  type ProtectedResourceMetadata,
  protectedResourceMetadataDocument,
  protectedResourceMetadataPaths,
  protectedResourceMetadataUrl,
  type StoredAuthorizationCode,
} from '@ttoss/auth-core';

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
  if (prm && options.resource) {
    // RFC 9728 §3.1 derives the metadata URL from the resource identifier's
    // path, so a resource with a path is discovered at
    // `/.well-known/oauth-protected-resource<path>` — not only at the root.
    // `protectedResourceMetadataPaths` owns that rule for every package here.
    for (const metadataPath of protectedResourceMetadataPaths({
      resource: options.resource,
    })) {
      router.get(metadataPath, (ctx: Context) => {
        applyResponse(ctx, prm);
      });
    }
  }

  router.get(engine.paths.authorize, async (ctx: Context) => {
    applyResponse(ctx, await engine.authorize(toAuthRequest(ctx)));
  });

  router.post(engine.paths.token, async (ctx: Context) => {
    applyResponse(ctx, await engine.token(toAuthRequest(ctx)));
  });

  router.post(engine.paths.register, async (ctx: Context) => {
    applyResponse(ctx, await engine.register(toAuthRequest(ctx)));
  });

  return router;
};

/**
 * Koa middleware that serves the RFC 9728 Protected Resource Metadata
 * document. Mount it **before** `authMiddleware` so the discovery endpoint
 * stays unauthenticated (clients fetch it before they have a token).
 *
 * It answers at every location `protectedResourceMetadataPaths` derives for
 * the resource: the root, plus the path-derived location of RFC 9728 §3.1 when
 * the resource identifier carries a path.
 */
export const createProtectedResourceMetadataMiddleware = (args: {
  /** The protected resource's identifier URI. */
  resource: string;
  /** Authorization server issuer URIs that issue tokens for this resource. */
  authorizationServers: string[];
}): Middleware => {
  const metadataPaths = new Set(
    protectedResourceMetadataPaths({ resource: args.resource })
  );
  const body = protectedResourceMetadataDocument({
    resource: args.resource,
    authorizationServers: args.authorizationServers,
  });

  return async (ctx: Context, next) => {
    if (ctx.method === 'GET' && metadataPaths.has(ctx.path)) {
      ctx.body = body;
      return;
    }
    await next();
  };
};
