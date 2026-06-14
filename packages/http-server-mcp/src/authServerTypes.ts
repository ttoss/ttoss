import type Koa from 'koa';

export type Context = Koa.Context;

/**
 * OAuth 2.0 client metadata as supplied by a client during Dynamic Client
 * Registration (RFC 7591). Apps may persist additional fields verbatim.
 */
export interface OAuthClientMetadata {
  /** Allowed redirect URIs. At least one is required for the auth-code flow. */
  redirect_uris: string[];
  /** Human-readable client name shown on consent screens. */
  client_name?: string;
  /** OAuth grant types the client will use. Defaults to auth-code + refresh. */
  grant_types?: string[];
  /** OAuth response types the client will use. Defaults to `['code']`. */
  response_types?: string[];
  /**
   * Client authentication method at the token endpoint. `'none'` registers a
   * public client (no secret issued); anything else registers a confidential
   * client and a `client_secret` is generated.
   */
  token_endpoint_auth_method?: string;
  /** Space-separated scopes the client may request. */
  scope?: string;
  [key: string]: unknown;
}

/**
 * A registered OAuth client as persisted by the app's {@link ClientStore}.
 */
export interface OAuthClient extends OAuthClientMetadata {
  /** Unique client identifier issued by the authorization server. */
  client_id: string;
  /** Client secret for confidential clients. Absent for public clients. */
  client_secret?: string;
  /** Unix timestamp (seconds) when the client was registered. */
  client_id_issued_at?: number;
}

/**
 * App-provided store for OAuth clients. ttoss owns protocol mechanics; the app
 * owns persistence (DynamoDB, Postgres, in-memory, …).
 */
export interface ClientStore {
  /** Look up a client by its `client_id`. Return `undefined` if unknown. */
  get: (
    clientId: string
  ) => Promise<OAuthClient | undefined> | OAuthClient | undefined;
  /** Persist a newly registered client. */
  register: (client: OAuthClient) => Promise<void> | void;
}

/**
 * A short-lived authorization code with its bound PKCE challenge and the
 * details needed to issue tokens when the code is later exchanged.
 */
export interface StoredAuthorizationCode {
  /** The opaque authorization code value. */
  code: string;
  /** The `client_id` the code was issued to. */
  clientId: string;
  /** The redirect URI the code was issued for (must match on exchange). */
  redirectUri: string;
  /** The PKCE `code_challenge` (S256) bound to this code. */
  codeChallenge: string;
  /** The scopes granted to this code. */
  scopes: string[];
  /** The authenticated end-user subject identifier. */
  subject: string;
  /** Unix timestamp (milliseconds) after which the code is invalid. */
  expiresAt: number;
}

/**
 * App-provided store for authorization codes. Codes are single-use and
 * short-lived; the app decides where to persist them.
 */
export interface AuthCodeStore {
  /** Persist an authorization code. */
  save: (code: StoredAuthorizationCode) => Promise<void> | void;
  /** Look up an authorization code by its value. */
  get: (
    code: string
  ) =>
    | Promise<StoredAuthorizationCode | undefined>
    | StoredAuthorizationCode
    | undefined;
  /** Remove an authorization code (called on exchange to enforce single use). */
  delete: (code: string) => Promise<void> | void;
}

/** Tokens returned by the app's {@link McpAuthServerOptions.issueTokens} hook. */
export interface IssuedTokens {
  /** The access token string (JWT, opaque, …). */
  accessToken: string;
  /** Optional refresh token enabling the `refresh_token` grant. */
  refreshToken?: string;
  /** Access token lifetime in seconds, surfaced as `expires_in`. */
  expiresIn?: number;
  /** Granted scopes as a space-separated string. Defaults to the bound scopes. */
  scope?: string;
}

/** Arguments passed to {@link McpAuthServerOptions.issueTokens}. */
export interface IssueTokensArgs {
  /** The authenticated end-user subject identifier. */
  subject: string;
  /** The scopes granted to the token. */
  scopes: string[];
  /** The client the tokens are being issued to. */
  client: OAuthClient;
}

/** The validated authorization request passed to the consent/login hook. */
export interface AuthorizeRequest {
  /** The requesting `client_id`. */
  clientId: string;
  /** The validated redirect URI. */
  redirectUri: string;
  /** The requested scopes. */
  scopes: string[];
  /** Opaque CSRF/state value to echo back on redirect. */
  state?: string;
  /** The PKCE `code_challenge`. */
  codeChallenge: string;
  /** The PKCE challenge method (always `'S256'`). */
  codeChallengeMethod: string;
}

/** Arguments passed to {@link McpAuthServerOptions.onAuthorize}. */
export interface OnAuthorizeArgs {
  /** The Koa context, so the app can read cookies/session or write a response. */
  ctx: Context;
  /** The resolved client making the request. */
  client: OAuthClient;
  /** The validated authorization request. */
  request: AuthorizeRequest;
}

/**
 * Result of the app's consent/login hook.
 *
 * `approved: true` means the end-user is authenticated and has consented — the
 * authorization server issues a code and redirects. `approved: false` means the
 * app has taken over the response (e.g. redirected to its own login/consent
 * page); the authorization server does nothing further.
 */
export type OnAuthorizeResult =
  | { approved: true; subject: string; scopes?: string[] }
  | { approved: false };

/** Arguments passed to {@link McpAuthServerOptions.onRefreshToken}. */
export interface OnRefreshTokenArgs {
  /** The refresh token presented by the client. */
  refreshToken: string;
  /** The authenticated client. */
  client: OAuthClient;
  /** Scopes requested in the refresh request (may be empty). */
  scopes: string[];
}

/**
 * Result of validating a refresh token. Return `undefined` to reject the token.
 */
export type OnRefreshTokenResult =
  | { subject: string; scopes: string[] }
  | undefined;

/** Configuration for {@link createMcpAuthServer}. */
export interface McpAuthServerOptions {
  /** The authorization server's issuer identifier (its base URL). */
  issuer: string;
  /** App-provided store for dynamic clients. */
  clientStore: ClientStore;
  /** App-provided store for short-lived authorization codes. */
  authCodeStore: AuthCodeStore;
  /**
   * App-owned token minting. ttoss never sees the user model or signing keys —
   * it hands you the subject/scopes/client and you return the tokens.
   */
  issueTokens: (args: IssueTokensArgs) => Promise<IssuedTokens> | IssuedTokens;
  /**
   * App-owned login/consent. Called on every `/authorize` request; return the
   * authenticated subject to approve, or take over the response to show your
   * own login/consent UI and return `{ approved: false }`.
   */
  onAuthorize: (
    args: OnAuthorizeArgs
  ) => Promise<OnAuthorizeResult> | OnAuthorizeResult;
  /**
   * App-owned refresh-token validation. Required to support the `refresh_token`
   * grant; when omitted, refresh requests get `unsupported_grant_type`.
   */
  onRefreshToken?: (
    args: OnRefreshTokenArgs
  ) => Promise<OnRefreshTokenResult> | OnRefreshTokenResult;
  /** Scopes advertised in discovery metadata (`scopes_supported`). */
  scopesSupported?: string[];
  /**
   * When set, also serves `/.well-known/oauth-protected-resource` (RFC 9728)
   * pairing this resource URL with the issuer as its authorization server.
   */
  resource?: string;
  /**
   * Authorization code lifetime in seconds.
   * @default 600
   */
  authorizationCodeTtl?: number;
  /** Override the default endpoint paths. */
  endpoints?: {
    /** @default '/authorize' */
    authorize?: string;
    /** @default '/token' */
    token?: string;
    /** @default '/register' */
    register?: string;
  };
}
