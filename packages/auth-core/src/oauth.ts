import crypto from 'node:crypto';

// ---------------------------------------------------------------------------
// PKCE (RFC 7636) — S256 only; `plain` is rejected
// ---------------------------------------------------------------------------

/**
 * Verifies a PKCE code challenge against a code verifier.
 *
 * Only the `S256` method is accepted. Passing `plain` or any other method
 * always returns `false`.
 */
export const verifyPkceChallenge = (args: {
  /** The original `code_verifier` string from the client. */
  codeVerifier: string;
  /** The `code_challenge` value the client sent in the authorization request. */
  codeChallenge: string;
  /** The `code_challenge_method` advertised by the client. Must be `S256`. */
  codeChallengeMethod: string;
}): boolean => {
  if (args.codeChallengeMethod !== 'S256') {
    return false;
  }
  if (!args.codeVerifier || !args.codeChallenge) {
    return false;
  }
  const expected = crypto
    .createHash('sha256')
    .update(args.codeVerifier)
    .digest('base64url');
  return expected === args.codeChallenge;
};

// ---------------------------------------------------------------------------
// Authorization codes — stateless crypto; storage is app-side
// ---------------------------------------------------------------------------

export type GeneratedAuthorizationCode = {
  /** Raw code to embed in the redirect. Show once; never persist. */
  code: string;
  /** SHA-256 hex of `code`. Persist this alongside bound metadata. */
  codeHash: string;
};

/**
 * Hashes a raw authorization code with SHA-256 (hex output).
 * Use this at consumption time to look up the stored record by hash.
 */
export const hashAuthorizationCode = (args: { code: string }): string => {
  return crypto.createHash('sha256').update(args.code).digest('hex');
};

/**
 * Generates a cryptographically random authorization code.
 *
 * Returns the raw code (for the redirect) and its SHA-256 hash (to persist).
 * Mirrors the `generateOneTimeToken` / `generateApiToken` pattern.
 */
export const generateAuthorizationCode = (): GeneratedAuthorizationCode => {
  const code = crypto.randomBytes(32).toString('hex');
  return { code, codeHash: hashAuthorizationCode({ code }) };
};

// ---------------------------------------------------------------------------
// Redirect URI validation (RFC 6749 §4.1.2.1) — exact match, no wildcards
// ---------------------------------------------------------------------------

/**
 * Returns `true` only if `redirectUri` exactly matches one of
 * `allowedRedirectUris`.
 *
 * Intentionally uses strict string equality: no trailing-slash
 * normalization, no query-string stripping, no host suffix checks.
 * This function is pure (no `node:crypto`) so it can be bundled for
 * browser-side consent pages.
 */
export const validateRedirectUri = (args: {
  /** The `redirect_uri` from the authorization request. */
  redirectUri: string;
  /** Exact URIs registered for the client. */
  allowedRedirectUris: readonly string[];
}): boolean => {
  return args.allowedRedirectUris.includes(args.redirectUri);
};

// ---------------------------------------------------------------------------
// RFC 6749 error vocabulary
// ---------------------------------------------------------------------------

export const oauthErrorCodes = [
  'invalid_request',
  'invalid_client',
  'invalid_grant',
  'unsupported_grant_type',
  'access_denied',
  'server_error',
] as const;

export type OAuthErrorCode = (typeof oauthErrorCodes)[number];

/** Structured OAuth 2.x error with an RFC 6749 error code. */
export class OAuthError extends Error {
  /** RFC 6749 error code. */
  readonly code: OAuthErrorCode;

  constructor(args: {
    /** RFC 6749 `error` value. */
    code: OAuthErrorCode;
    /** Human-readable `error_description`. */
    description: string;
  }) {
    super(args.description);
    this.name = 'OAuthError';
    this.code = args.code;
  }
}

// ---------------------------------------------------------------------------
// Discovery document builders (RFC 8414 / RFC 9728) — pure object builders
// ---------------------------------------------------------------------------

export type Rfc8414Metadata = {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  registration_endpoint?: string;
  response_types_supported: ['code'];
  grant_types_supported: ['authorization_code'];
  code_challenge_methods_supported: ['S256'];
  token_endpoint_auth_methods_supported: ['none'];
};

export type Rfc9728Metadata = {
  resource: string;
  authorization_servers: string[];
};

/**
 * Builds an RFC 8414 Authorization Server Metadata object.
 *
 * Advertises only the `code` response type, `authorization_code` grant,
 * `S256` PKCE, and the `none` token endpoint auth method — matching the
 * MCP auth spec requirements.
 */
export const buildAuthorizationServerMetadata = (args: {
  /** The authorization server's issuer identifier URI. */
  issuer: string;
  /** URL of the authorization endpoint. */
  authorizationEndpoint: string;
  /** URL of the token endpoint. */
  tokenEndpoint: string;
  /** URL of the dynamic client registration endpoint (optional). */
  registrationEndpoint?: string;
}): Rfc8414Metadata => {
  const meta: Rfc8414Metadata = {
    issuer: args.issuer,
    authorization_endpoint: args.authorizationEndpoint,
    token_endpoint: args.tokenEndpoint,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['none'],
  };
  if (args.registrationEndpoint !== undefined) {
    meta.registration_endpoint = args.registrationEndpoint;
  }
  return meta;
};

/**
 * Builds an RFC 9728 Protected Resource Metadata object.
 */
export const buildProtectedResourceMetadata = (args: {
  /** The protected resource's identifier URI. */
  resource: string;
  /** List of authorization server issuer URIs that protect this resource. */
  authorizationServers: string[];
}): Rfc9728Metadata => {
  return {
    resource: args.resource,
    authorization_servers: args.authorizationServers,
  };
};
