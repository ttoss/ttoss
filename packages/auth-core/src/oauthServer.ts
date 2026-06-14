import { randomBytes } from 'node:crypto';

import { verifyPkceChallenge } from './oauth';
import type {
  ClientStore,
  IssuedTokens,
  OAuthClient,
  OAuthRequest,
  OAuthResponse,
  OAuthServer,
  OAuthServerOptions,
} from './oauthServerTypes';

export * from './oauthServerTypes';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const base64Url = (buffer: Buffer): string => {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

const generateToken = (bytes = 32): string => {
  return base64Url(randomBytes(bytes));
};

const joinUrl = (issuer: string, path: string): string => {
  return `${issuer.replace(/\/$/, '')}${path}`;
};

const asString = (value: unknown): string | undefined => {
  return typeof value === 'string' ? value : undefined;
};

const parseScopes = (scope: unknown): string[] => {
  const value = asString(scope);
  return value ? value.split(' ').filter(Boolean) : [];
};

const oauthError = (
  status: number,
  error: string,
  description: string
): OAuthResponse => {
  return { status, body: { error, error_description: description } };
};

const buildTokenResponse = (
  tokens: IssuedTokens,
  scopes: string[]
): Record<string, unknown> => {
  return {
    access_token: tokens.accessToken,
    token_type: 'Bearer',
    ...(tokens.expiresIn !== undefined ? { expires_in: tokens.expiresIn } : {}),
    ...(tokens.refreshToken !== undefined
      ? { refresh_token: tokens.refreshToken }
      : {}),
    scope: tokens.scope ?? scopes.join(' '),
  };
};

const redirectWithParams = (
  redirectUri: string,
  params: Record<string, string | undefined>
): string => {
  const url = new URL(redirectUri);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
};

/**
 * Authenticates the client at the token endpoint via `client_secret_basic`
 * (Authorization header), `client_secret_post` (body), or `none` (public,
 * PKCE-only). Returns the client, or `undefined` when authentication fails.
 */
const authenticateClient = async (
  request: OAuthRequest,
  clientStore: ClientStore
): Promise<OAuthClient | undefined> => {
  let clientId = asString(request.body.client_id);
  let clientSecret = asString(request.body.client_secret);

  const authHeader = request.headers.authorization;
  if (authHeader?.startsWith('Basic ')) {
    const decoded = Buffer.from(authHeader.slice(6), 'base64').toString();
    const separatorIndex = decoded.indexOf(':');
    if (separatorIndex !== -1) {
      clientId = decodeURIComponent(decoded.slice(0, separatorIndex));
      clientSecret = decodeURIComponent(decoded.slice(separatorIndex + 1));
    }
  }

  if (!clientId) {
    return undefined;
  }

  const client = await clientStore.get(clientId);
  if (!client) {
    return undefined;
  }

  // Confidential clients must present the matching secret.
  if (client.client_secret && client.client_secret !== clientSecret) {
    return undefined;
  }

  return client;
};

// ---------------------------------------------------------------------------
// Grant handlers
// ---------------------------------------------------------------------------

// eslint-disable-next-line complexity
const handleAuthorizationCodeGrant = async (
  request: OAuthRequest,
  options: OAuthServerOptions
): Promise<OAuthResponse> => {
  const { clientStore, authCodeStore, issueTokens } = options;
  const { body } = request;

  const client = await authenticateClient(request, clientStore);
  if (!client) {
    return oauthError(401, 'invalid_client', 'client authentication failed');
  }

  const code = asString(body.code);
  if (!code) {
    return oauthError(400, 'invalid_request', 'code is required');
  }

  const stored = await authCodeStore.get(code);
  // Always consume the code so it cannot be replayed, even on failure.
  await authCodeStore.delete(code);

  if (!stored) {
    return oauthError(
      400,
      'invalid_grant',
      'invalid or expired authorization code'
    );
  }

  if (stored.expiresAt < Date.now()) {
    return oauthError(400, 'invalid_grant', 'authorization code expired');
  }

  if (stored.clientId !== client.client_id) {
    return oauthError(
      400,
      'invalid_grant',
      'authorization code was not issued to this client'
    );
  }

  if (stored.redirectUri !== asString(body.redirect_uri)) {
    return oauthError(400, 'invalid_grant', 'redirect_uri mismatch');
  }

  const codeVerifier = asString(body.code_verifier);
  if (!codeVerifier) {
    return oauthError(400, 'invalid_request', 'code_verifier is required');
  }

  if (
    !verifyPkceChallenge({
      codeVerifier,
      codeChallenge: stored.codeChallenge,
      codeChallengeMethod: 'S256',
    })
  ) {
    return oauthError(400, 'invalid_grant', 'PKCE verification failed');
  }

  const tokens = await issueTokens({
    subject: stored.subject,
    scopes: stored.scopes,
    client,
  });
  return { status: 200, body: buildTokenResponse(tokens, stored.scopes) };
};

const handleRefreshTokenGrant = async (
  request: OAuthRequest,
  options: OAuthServerOptions
): Promise<OAuthResponse> => {
  const { clientStore, issueTokens, onRefreshToken } = options;
  const { body } = request;

  const client = await authenticateClient(request, clientStore);
  if (!client) {
    return oauthError(401, 'invalid_client', 'client authentication failed');
  }

  if (!onRefreshToken) {
    return oauthError(
      400,
      'unsupported_grant_type',
      'refresh_token grant is not supported'
    );
  }

  const refreshToken = asString(body.refresh_token);
  if (!refreshToken) {
    return oauthError(400, 'invalid_request', 'refresh_token is required');
  }

  const result = await onRefreshToken({
    refreshToken,
    client,
    scopes: parseScopes(body.scope),
  });
  if (!result) {
    return oauthError(400, 'invalid_grant', 'invalid refresh token');
  }

  const tokens = await issueTokens({
    subject: result.subject,
    scopes: result.scopes,
    client,
  });
  return { status: 200, body: buildTokenResponse(tokens, result.scopes) };
};

/**
 * Validates the authorization request's `response_type` and PKCE parameters,
 * returning a redirect-error response when invalid, or `undefined` when valid.
 */
const validateAuthorizeParams = (
  query: Record<string, string | undefined>,
  redirectUri: string,
  state: string | undefined
): OAuthResponse | undefined => {
  const redirectError = (error: string, description: string): OAuthResponse => {
    return {
      status: 302,
      redirect: redirectWithParams(redirectUri, {
        error,
        error_description: description,
        state,
      }),
    };
  };

  if (asString(query.response_type) !== 'code') {
    return redirectError(
      'unsupported_response_type',
      'response_type must be code'
    );
  }
  if (!asString(query.code_challenge)) {
    return redirectError(
      'invalid_request',
      'code_challenge is required (PKCE)'
    );
  }
  if ((asString(query.code_challenge_method) ?? 'plain') !== 'S256') {
    return redirectError(
      'invalid_request',
      'code_challenge_method must be S256'
    );
  }
  return undefined;
};

/** Builds the response when the app declines an authorization (login/consent). */
const declineResponse = (result: {
  redirect?: string;
  status?: number;
  body?: unknown;
}): OAuthResponse => {
  if (result.redirect !== undefined) {
    return { status: 302, redirect: result.redirect };
  }
  return { status: result.status ?? 401, body: result.body };
};

const handleAuthorize = async (
  request: OAuthRequest,
  options: OAuthServerOptions
): Promise<OAuthResponse> => {
  const { clientStore, authCodeStore, onAuthorize } = options;
  const { query } = request;

  const clientId = asString(query.client_id);
  if (!clientId) {
    return oauthError(400, 'invalid_request', 'client_id is required');
  }

  const client = await clientStore.get(clientId);
  if (!client) {
    return oauthError(400, 'invalid_client', 'unknown client_id');
  }

  // redirect_uri must be validated before redirecting any errors back to it.
  const redirectUri = asString(query.redirect_uri);
  if (!redirectUri || !client.redirect_uris.includes(redirectUri)) {
    return oauthError(
      400,
      'invalid_request',
      'redirect_uri is missing or not registered for this client'
    );
  }

  const state = asString(query.state);
  const invalid = validateAuthorizeParams(query, redirectUri, state);
  if (invalid) {
    return invalid;
  }

  const scopes = parseScopes(query.scope);
  const codeChallenge = asString(query.code_challenge)!;

  const result = await onAuthorize({
    client,
    headers: request.headers,
    request: {
      clientId,
      redirectUri,
      scopes,
      state,
      codeChallenge,
      codeChallengeMethod: 'S256',
    },
  });

  if (!result.approved) {
    return declineResponse(result);
  }

  const code = generateToken();
  await authCodeStore.save({
    code,
    clientId,
    redirectUri,
    codeChallenge,
    scopes: result.scopes ?? scopes,
    subject: result.subject,
    expiresAt: Date.now() + (options.authorizationCodeTtl ?? 600) * 1000,
  });

  return {
    status: 302,
    redirect: redirectWithParams(redirectUri, { code, state }),
  };
};

const handleRegister = async (
  request: OAuthRequest,
  clientStore: ClientStore
): Promise<OAuthResponse> => {
  const metadata = request.body;
  const redirectUris = metadata.redirect_uris;

  if (
    !Array.isArray(redirectUris) ||
    redirectUris.length === 0 ||
    !redirectUris.every((uri) => {
      return typeof uri === 'string';
    })
  ) {
    return oauthError(
      400,
      'invalid_redirect_uri',
      'redirect_uris is required and must be an array of strings'
    );
  }

  const tokenAuthMethod =
    asString(metadata.token_endpoint_auth_method) ?? 'client_secret_basic';
  const isPublic = tokenAuthMethod === 'none';

  const client: OAuthClient = {
    ...metadata,
    client_id: generateToken(16),
    redirect_uris: redirectUris,
    token_endpoint_auth_method: tokenAuthMethod,
    grant_types: (metadata.grant_types as string[]) ?? [
      'authorization_code',
      'refresh_token',
    ],
    response_types: (metadata.response_types as string[]) ?? ['code'],
    client_id_issued_at: Math.floor(Date.now() / 1000),
  };

  if (!isPublic) {
    client.client_secret = generateToken(32);
    // 0 = the secret never expires (RFC 7591).
    client.client_secret_expires_at = 0;
  }

  await clientStore.register(client);

  return { status: 201, body: client };
};

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Creates runner-agnostic OAuth 2.1 Authorization Server handlers.
 *
 * Implements the authorization endpoint (PKCE S256 required), token endpoint
 * (`authorization_code` + `refresh_token` grants), Dynamic Client Registration
 * (RFC 7591), and discovery metadata (RFC 8414, plus RFC 9728 when `resource`
 * is set). The handlers operate on plain {@link OAuthRequest} /
 * {@link OAuthResponse} objects, so any HTTP runtime can host them through a
 * thin adapter — `@ttoss/http-server` provides the Koa one.
 *
 * The app owns its user model, signing keys, and login/consent UI through the
 * option hooks; this core never sees them.
 *
 * @param options - Authorization server configuration and pluggable hooks.
 *
 * @example
 * ```typescript
 * const oauth = createOAuthServer({ issuer, clientStore, authCodeStore, issueTokens, onAuthorize });
 * const res = await oauth.token({ query: {}, body, headers });
 * ```
 */
export const createOAuthServer = (options: OAuthServerOptions): OAuthServer => {
  const { issuer, scopesSupported, resource } = options;
  const paths = {
    authorize: options.endpoints?.authorize ?? '/authorize',
    token: options.endpoints?.token ?? '/token',
    register: options.endpoints?.register ?? '/register',
  };

  return {
    paths,

    authorizationServerMetadata: (): OAuthResponse => {
      return {
        status: 200,
        body: {
          issuer,
          authorization_endpoint: joinUrl(issuer, paths.authorize),
          token_endpoint: joinUrl(issuer, paths.token),
          registration_endpoint: joinUrl(issuer, paths.register),
          response_types_supported: ['code'],
          grant_types_supported: ['authorization_code', 'refresh_token'],
          code_challenge_methods_supported: ['S256'],
          token_endpoint_auth_methods_supported: [
            'client_secret_basic',
            'client_secret_post',
            'none',
          ],
          ...(scopesSupported ? { scopes_supported: scopesSupported } : {}),
        },
      };
    },

    protectedResourceMetadata: (): OAuthResponse | undefined => {
      if (!resource) {
        return undefined;
      }
      return {
        status: 200,
        body: { resource, authorization_servers: [issuer] },
      };
    },

    authorize: (request: OAuthRequest) => {
      return handleAuthorize(request, options);
    },

    token: async (request: OAuthRequest): Promise<OAuthResponse> => {
      const grantType = asString(request.body.grant_type);
      if (grantType === 'authorization_code') {
        return handleAuthorizationCodeGrant(request, options);
      }
      if (grantType === 'refresh_token') {
        return handleRefreshTokenGrant(request, options);
      }
      return oauthError(
        400,
        'unsupported_grant_type',
        'grant_type must be authorization_code or refresh_token'
      );
    },

    register: (request: OAuthRequest) => {
      return handleRegister(request, options.clientStore);
    },
  };
};

/**
 * Returns the `WWW-Authenticate` header value for a 401 response on a protected
 * resource, advertising the RFC 9728 resource-metadata URL so OAuth/MCP clients
 * can bootstrap discovery.
 *
 * @example
 * ```typescript
 * getWwwAuthenticateHeader({ resource: 'https://mcp.example.com' });
 * // => 'Bearer resource_metadata="https://mcp.example.com/.well-known/oauth-protected-resource"'
 * ```
 */
export const getWwwAuthenticateHeader = (args: {
  /**
   * The resource server URL. The metadata URL is derived as
   * `<resource>/.well-known/oauth-protected-resource` per RFC 9728.
   */
  resource: string;
}): string => {
  const metadataUrl = `${args.resource.replace(/\/$/, '')}/.well-known/oauth-protected-resource`;
  return `Bearer resource_metadata="${metadataUrl}"`;
};
