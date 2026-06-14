import {
  createOAuthHandlers,
  type OAuthRequest,
  type OAuthResponse,
  type OAuthServerOptions,
} from '@ttoss/auth-core';
import { CognitoJwtVerifier } from '@ttoss/auth-core/amazon-cognito';
import { type Context, type Middleware, Router } from '@ttoss/http-server';

/**
 * The OAuth authorization-server option types and runner-agnostic engine live
 * in `@ttoss/auth-core`; these are the Koa adapters that mount it on an
 * `@ttoss/http-server` app. Re-exported for convenience so a consumer needs a
 * single import.
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

// ---------------------------------------------------------------------------
// Authorization server: mount the engine as a Koa Router
// ---------------------------------------------------------------------------

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
 * This is the opt-in "http-server with OAuth (issuing)" path — call it only
 * when your app issues its own tokens.
 *
 * @example
 * ```typescript
 * import { App, bodyParser, oauthServer } from '@ttoss/http-server';
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

// ---------------------------------------------------------------------------
// Resource server: verify incoming tokens (opt-in middleware)
// ---------------------------------------------------------------------------

/** Amazon Cognito user pool configuration for JWT verification. */
export interface CognitoUserPoolConfig {
  /** The Cognito User Pool ID (e.g. `us-east-1_abc123`). */
  userPoolId: string;
  /**
   * Which token type to verify.
   * @default 'access'
   */
  tokenUse?: 'access' | 'id';
  /** The app client ID registered in the User Pool. */
  clientId: string;
}

/**
 * Options for {@link oauthVerify}. Supply either `cognitoUserPool` (uses
 * `CognitoJwtVerifier` from `@ttoss/auth-core`) or a custom `verifyToken`.
 */
export interface OAuthVerifyOptions {
  /** Amazon Cognito user pool config; the middleware builds a verifier from it. */
  cognitoUserPool?: CognitoUserPoolConfig;
  /**
   * Custom token verifier for non-Cognito providers (Auth0, Keycloak, your own
   * JWTs, opaque tokens). Resolve with the verified payload, or throw to reject.
   */
  verifyToken?: (token: string) => Promise<unknown>;
  /**
   * Scopes that must all be present on the token. Missing any → `403`. Scopes
   * are read from a space-separated `scope` claim.
   */
  requiredScopes?: string[];
  /**
   * JSON-RPC methods (read from `body.method`) that bypass verification, so a
   * client can reach them before authenticating. Defaults to none.
   */
  publicMethods?: string[];
  /**
   * When set, a `401` responds with `WWW-Authenticate: Bearer
   * resource_metadata="<url>"` (RFC 9728) instead of a bare `Bearer`.
   */
  resourceMetadataUrl?: string;
}

const buildTokenVerifier = (
  options: OAuthVerifyOptions
): ((token: string) => Promise<unknown>) => {
  if (options.cognitoUserPool) {
    const verifier = CognitoJwtVerifier.create({
      tokenUse: 'access',
      ...options.cognitoUserPool,
    });
    return (token) => {
      return verifier.verify(token);
    };
  }
  if (options.verifyToken) {
    return options.verifyToken;
  }
  throw new Error(
    'OAuthVerifyOptions requires either cognitoUserPool or verifyToken'
  );
};

/** Returns true when the identity carries every required scope (or none are required). */
const hasRequiredScopes = (
  requiredScopes: string[] | undefined,
  identity: unknown
): boolean => {
  if (!requiredScopes?.length) {
    return true;
  }
  const scope = (identity as { scope?: string })?.scope ?? '';
  const tokenScopes = scope.split(' ');
  return requiredScopes.every((s) => {
    return tokenScopes.includes(s);
  });
};

/**
 * Koa middleware that verifies the incoming `Authorization: Bearer` token (the
 * OAuth resource-server role). Invalid or missing tokens get `401` (with an
 * RFC 9728 `WWW-Authenticate` header when `resourceMetadataUrl` is set); tokens
 * missing a `requiredScopes` entry get `403`. On success the verified payload
 * is stored on `ctx.state.identity`.
 *
 * This is the opt-in "http-server with OAuth (verifying)" path.
 *
 * @example
 * ```typescript
 * app.use(oauthVerify({ verifyToken: async (t) => myJwt.verify(t), requiredScopes: ['read'] }));
 * ```
 */
export const oauthVerify = (options: OAuthVerifyOptions): Middleware => {
  const verifier = buildTokenVerifier(options);
  const publicMethods = new Set(options.publicMethods ?? []);
  const unauthorizedHeader = options.resourceMetadataUrl
    ? `Bearer resource_metadata="${options.resourceMetadataUrl}"`
    : 'Bearer';

  return async (ctx: Context, next) => {
    const method = (ctx.request.body as { method?: string } | undefined)
      ?.method;
    if (publicMethods.has(method ?? '')) {
      await next();
      return;
    }

    const authHeader = ctx.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '';

    let identity: unknown;
    try {
      identity = await verifier(token);
    } catch {
      ctx.status = 401;
      ctx.set('WWW-Authenticate', unauthorizedHeader);
      ctx.body = 'Unauthorized';
      return;
    }

    if (!hasRequiredScopes(options.requiredScopes, identity)) {
      ctx.status = 403;
      ctx.body = 'Forbidden';
      return;
    }

    (ctx.state as { identity?: unknown }).identity = identity;
    await next();
  };
};

/**
 * Koa middleware that serves `GET /.well-known/oauth-protected-resource`
 * (RFC 9728). Mount it **before** {@link oauthVerify} so the discovery endpoint
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
