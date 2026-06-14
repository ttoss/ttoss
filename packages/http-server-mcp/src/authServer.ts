import { Router } from '@ttoss/http-server';

import {
  asString,
  handleAuthorizationCodeGrant,
  handleAuthorize,
  handleRefreshTokenGrant,
  handleRegister,
  joinUrl,
  sendOAuthError,
} from './authServerHandlers';
import type { Context, McpAuthServerOptions } from './authServerTypes';

export * from './authServerTypes';

/**
 * Creates transport-agnostic OAuth 2.1 Authorization Server primitives for MCP.
 *
 * Mounts the authorization endpoint (`/authorize`, PKCE S256 required), token
 * endpoint (`/token`, `authorization_code` + `refresh_token` grants), Dynamic
 * Client Registration (`/register`, RFC 7591), and AS metadata discovery
 * (`/.well-known/oauth-authorization-server`, RFC 8414). When `resource` is
 * set, it also serves the protected-resource metadata (RFC 9728).
 *
 * ttoss owns only the protocol mechanics — the app supplies its own stores,
 * token signing/verification, and login/consent UI through the option hooks, so
 * the user model, JWT/IAM, and authentication never leave the consuming app.
 *
 * @param options - Authorization server configuration and pluggable hooks.
 * @returns A Koa `Router` exposing `routes()` / `allowedMethods()`.
 *
 * @example
 * ```typescript
 * import { App, bodyParser } from '@ttoss/http-server';
 * import { createMcpAuthServer } from '@ttoss/http-server-mcp';
 *
 * const authServer = createMcpAuthServer({
 *   issuer: 'https://api.soat.dev',
 *   clientStore,
 *   authCodeStore,
 *   issueTokens: async ({ subject, scopes }) => ({
 *     accessToken: signJwt({ sub: subject, scope: scopes.join(' ') }),
 *     refreshToken: createRefreshToken(subject),
 *     expiresIn: 3600,
 *   }),
 *   onAuthorize: async ({ ctx }) => {
 *     const session = await getSession(ctx);
 *     if (!session) {
 *       ctx.redirect('/login');
 *       return { approved: false };
 *     }
 *     return { approved: true, subject: session.userId };
 *   },
 *   scopesSupported: ['mcp:access'],
 * });
 *
 * const app = new App();
 * app.use(bodyParser());
 * app.use(authServer.routes());
 * ```
 */
export const createMcpAuthServer = (options: McpAuthServerOptions): Router => {
  const { issuer, clientStore, scopesSupported, resource } = options;
  const authorizePath = options.endpoints?.authorize ?? '/authorize';
  const tokenPath = options.endpoints?.token ?? '/token';
  const registerPath = options.endpoints?.register ?? '/register';

  const router = new Router();

  router.get('/.well-known/oauth-authorization-server', (ctx: Context) => {
    ctx.body = {
      issuer,
      authorization_endpoint: joinUrl(issuer, authorizePath),
      token_endpoint: joinUrl(issuer, tokenPath),
      registration_endpoint: joinUrl(issuer, registerPath),
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code', 'refresh_token'],
      code_challenge_methods_supported: ['S256'],
      token_endpoint_auth_methods_supported: [
        'client_secret_basic',
        'client_secret_post',
        'none',
      ],
      ...(scopesSupported ? { scopes_supported: scopesSupported } : {}),
    };
  });

  if (resource) {
    router.get('/.well-known/oauth-protected-resource', (ctx: Context) => {
      ctx.body = {
        resource,
        authorization_servers: [issuer],
      };
    });
  }

  router.get(authorizePath, async (ctx: Context) => {
    const clientId = asString(ctx.query.client_id);
    if (!clientId) {
      sendOAuthError(ctx, 400, 'invalid_request', 'client_id is required');
      return;
    }

    const client = await clientStore.get(clientId);
    if (!client) {
      sendOAuthError(ctx, 400, 'invalid_client', 'unknown client_id');
      return;
    }

    // redirect_uri must be validated before redirecting any errors back to it.
    const redirectUri = asString(ctx.query.redirect_uri);
    if (!redirectUri || !client.redirect_uris.includes(redirectUri)) {
      sendOAuthError(
        ctx,
        400,
        'invalid_request',
        'redirect_uri is missing or not registered for this client'
      );
      return;
    }

    await handleAuthorize(ctx, options, redirectUri);
  });

  router.post(tokenPath, async (ctx: Context) => {
    const body = (ctx.request.body ?? {}) as Record<string, unknown>;
    const grantType = asString(body.grant_type);

    if (grantType === 'authorization_code') {
      await handleAuthorizationCodeGrant(ctx, body, options);
      return;
    }

    if (grantType === 'refresh_token') {
      await handleRefreshTokenGrant(ctx, body, options);
      return;
    }

    sendOAuthError(
      ctx,
      400,
      'unsupported_grant_type',
      'grant_type must be authorization_code or refresh_token'
    );
  });

  router.post(registerPath, async (ctx: Context) => {
    await handleRegister(ctx, clientStore);
  });

  return router;
};
