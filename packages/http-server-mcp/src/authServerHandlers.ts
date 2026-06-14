import { createHash, randomBytes } from 'node:crypto';

import type {
  ClientStore,
  Context,
  IssuedTokens,
  McpAuthServerOptions,
  OAuthClient,
} from './authServerTypes';

const base64UrlEncode = (buffer: Buffer): string => {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

/** Generates a URL-safe random token of the given byte length. */
export const generateToken = (bytes = 32): string => {
  return base64UrlEncode(randomBytes(bytes));
};

const sha256Base64Url = (input: string): string => {
  return base64UrlEncode(createHash('sha256').update(input).digest());
};

/** Verifies a PKCE `code_verifier` against a stored S256 `code_challenge`. */
const verifyPkce = (codeVerifier: string, codeChallenge: string): boolean => {
  return sha256Base64Url(codeVerifier) === codeChallenge;
};

/** Joins an issuer base URL with a path, collapsing any duplicate slash. */
export const joinUrl = (issuer: string, path: string): string => {
  return `${issuer.replace(/\/$/, '')}${path}`;
};

/** Returns the value if it is a string, otherwise `undefined`. */
export const asString = (value: unknown): string | undefined => {
  return typeof value === 'string' ? value : undefined;
};

const parseScopes = (scope: unknown): string[] => {
  const value = asString(scope);
  return value ? value.split(' ').filter(Boolean) : [];
};

/** Writes a spec-compliant OAuth error response (RFC 6749 §5.2). */
export const sendOAuthError = (
  ctx: Context,
  status: number,
  error: string,
  description: string
): void => {
  ctx.status = status;
  ctx.body = { error, error_description: description };
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

/**
 * Authenticates the client at the token endpoint via `client_secret_basic`
 * (Authorization header), `client_secret_post` (body), or `none` (public,
 * PKCE-only). Returns the client, or `undefined` when authentication fails.
 */
const authenticateClient = async (
  ctx: Context,
  body: Record<string, unknown>,
  clientStore: ClientStore
): Promise<OAuthClient | undefined> => {
  let clientId = asString(body.client_id);
  let clientSecret = asString(body.client_secret);

  const authHeader = ctx.headers.authorization;
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

/** Handles `grant_type=authorization_code` token requests (with PKCE verify). */
export const handleAuthorizationCodeGrant = async (
  ctx: Context,
  body: Record<string, unknown>,
  options: McpAuthServerOptions
  // eslint-disable-next-line complexity
): Promise<void> => {
  const { clientStore, authCodeStore, issueTokens } = options;

  const client = await authenticateClient(ctx, body, clientStore);
  if (!client) {
    sendOAuthError(ctx, 401, 'invalid_client', 'client authentication failed');
    return;
  }

  const code = asString(body.code);
  if (!code) {
    sendOAuthError(ctx, 400, 'invalid_request', 'code is required');
    return;
  }

  const stored = await authCodeStore.get(code);
  // Always consume the code so it cannot be replayed, even on failure.
  await authCodeStore.delete(code);

  if (!stored) {
    sendOAuthError(
      ctx,
      400,
      'invalid_grant',
      'invalid or expired authorization code'
    );
    return;
  }

  if (stored.expiresAt < Date.now()) {
    sendOAuthError(ctx, 400, 'invalid_grant', 'authorization code expired');
    return;
  }

  if (stored.clientId !== client.client_id) {
    sendOAuthError(
      ctx,
      400,
      'invalid_grant',
      'authorization code was not issued to this client'
    );
    return;
  }

  if (stored.redirectUri !== asString(body.redirect_uri)) {
    sendOAuthError(ctx, 400, 'invalid_grant', 'redirect_uri mismatch');
    return;
  }

  const codeVerifier = asString(body.code_verifier);
  if (!codeVerifier) {
    sendOAuthError(ctx, 400, 'invalid_request', 'code_verifier is required');
    return;
  }

  if (!verifyPkce(codeVerifier, stored.codeChallenge)) {
    sendOAuthError(ctx, 400, 'invalid_grant', 'PKCE verification failed');
    return;
  }

  const tokens = await issueTokens({
    subject: stored.subject,
    scopes: stored.scopes,
    client,
  });
  ctx.body = buildTokenResponse(tokens, stored.scopes);
};

/** Handles `grant_type=refresh_token` token requests. */
export const handleRefreshTokenGrant = async (
  ctx: Context,
  body: Record<string, unknown>,
  options: McpAuthServerOptions
): Promise<void> => {
  const { clientStore, issueTokens, onRefreshToken } = options;

  const client = await authenticateClient(ctx, body, clientStore);
  if (!client) {
    sendOAuthError(ctx, 401, 'invalid_client', 'client authentication failed');
    return;
  }

  if (!onRefreshToken) {
    sendOAuthError(
      ctx,
      400,
      'unsupported_grant_type',
      'refresh_token grant is not supported'
    );
    return;
  }

  const refreshToken = asString(body.refresh_token);
  if (!refreshToken) {
    sendOAuthError(ctx, 400, 'invalid_request', 'refresh_token is required');
    return;
  }

  const result = await onRefreshToken({
    refreshToken,
    client,
    scopes: parseScopes(body.scope),
  });
  if (!result) {
    sendOAuthError(ctx, 400, 'invalid_grant', 'invalid refresh token');
    return;
  }

  const tokens = await issueTokens({
    subject: result.subject,
    scopes: result.scopes,
    client,
  });
  ctx.body = buildTokenResponse(tokens, result.scopes);
};

/**
 * Handles the authorization request after `client_id` and `redirect_uri` have
 * been validated: enforces PKCE, runs the consent hook, and issues a code.
 */
export const handleAuthorize = async (
  ctx: Context,
  options: McpAuthServerOptions,
  redirectUri: string
  // eslint-disable-next-line complexity
): Promise<void> => {
  const { clientStore, authCodeStore, onAuthorize } = options;
  const ttl = options.authorizationCodeTtl ?? 600;

  const clientId = asString(ctx.query.client_id)!;
  const client = (await clientStore.get(clientId))!;
  const state = asString(ctx.query.state);

  const redirectError = (error: string, description: string): void => {
    const url = new URL(redirectUri);
    url.searchParams.set('error', error);
    url.searchParams.set('error_description', description);
    if (state) {
      url.searchParams.set('state', state);
    }
    ctx.redirect(url.toString());
  };

  if (asString(ctx.query.response_type) !== 'code') {
    redirectError('unsupported_response_type', 'response_type must be code');
    return;
  }

  const codeChallenge = asString(ctx.query.code_challenge);
  if (!codeChallenge) {
    redirectError('invalid_request', 'code_challenge is required (PKCE)');
    return;
  }

  const codeChallengeMethod =
    asString(ctx.query.code_challenge_method) ?? 'plain';
  if (codeChallengeMethod !== 'S256') {
    redirectError('invalid_request', 'code_challenge_method must be S256');
    return;
  }

  const scopes = parseScopes(ctx.query.scope);

  const result = await onAuthorize({
    ctx,
    client,
    request: {
      clientId,
      redirectUri,
      scopes,
      state,
      codeChallenge,
      codeChallengeMethod,
    },
  });

  if (!result.approved) {
    // The app took over the response (login/consent UI).
    return;
  }

  const grantedScopes = result.scopes ?? scopes;
  const code = generateToken();
  await authCodeStore.save({
    code,
    clientId,
    redirectUri,
    codeChallenge,
    scopes: grantedScopes,
    subject: result.subject,
    expiresAt: Date.now() + ttl * 1000,
  });

  const url = new URL(redirectUri);
  url.searchParams.set('code', code);
  if (state) {
    url.searchParams.set('state', state);
  }
  ctx.redirect(url.toString());
};

/** Handles Dynamic Client Registration (RFC 7591) requests. */
export const handleRegister = async (
  ctx: Context,
  clientStore: ClientStore
): Promise<void> => {
  const metadata = (ctx.request.body ?? {}) as Record<string, unknown>;
  const redirectUris = metadata.redirect_uris;

  if (
    !Array.isArray(redirectUris) ||
    redirectUris.length === 0 ||
    !redirectUris.every((uri) => {
      return typeof uri === 'string';
    })
  ) {
    sendOAuthError(
      ctx,
      400,
      'invalid_redirect_uri',
      'redirect_uris is required and must be an array of strings'
    );
    return;
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

  ctx.status = 201;
  ctx.body = client;
};
