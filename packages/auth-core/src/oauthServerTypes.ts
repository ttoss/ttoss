// ---------------------------------------------------------------------------
// Runner-agnostic HTTP shapes
//
// The OAuth server logic (see ./oauthServer) is decoupled from any HTTP
// framework. An adapter (Koa via @ttoss/http-server, AWS API Gateway, …)
// translates its own request/response objects to and from these plain shapes.
// ---------------------------------------------------------------------------

/** A normalized inbound HTTP request, framework-agnostic. */
export interface OAuthRequest {
  /** Query-string parameters (e.g. from `/authorize?client_id=...`). */
  query: Record<string, string | undefined>;
  /** Parsed request body (e.g. form-encoded `/token` or JSON `/register`). */
  body: Record<string, unknown>;
  /** Request headers, lower-cased keys recommended (e.g. `authorization`). */
  headers: Record<string, string | undefined>;
}

/**
 * A normalized outbound HTTP response. Either a JSON `body` with `status`, or a
 * `redirect` (302) — never both. Adapters apply this to their own response.
 */
export interface OAuthResponse {
  /** HTTP status code. Defaults to 200 when `redirect` is unset. */
  status: number;
  /** JSON-serializable response body. */
  body?: unknown;
  /** When set, the adapter should issue a 302 redirect to this URL. */
  redirect?: string;
}

// ---------------------------------------------------------------------------
// Client + store contracts (app-provided persistence)
// ---------------------------------------------------------------------------

/** Client metadata as submitted to Dynamic Client Registration (RFC 7591). */
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

/** A registered OAuth client as persisted by the app's {@link ClientStore}. */
export interface OAuthClient extends OAuthClientMetadata {
  /** Unique client identifier issued by the authorization server. */
  client_id: string;
  /** Client secret for confidential clients. Absent for public clients. */
  client_secret?: string;
  /** Unix timestamp (seconds) when the client was registered. */
  client_id_issued_at?: number;
}

/**
 * App-provided store for OAuth clients. The core owns protocol mechanics; the
 * app owns persistence (DynamoDB, Postgres, in-memory, …).
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

/**
 * A persisted refresh token, stored by its hash (never the plaintext value) so
 * a store compromise does not leak usable tokens. Owned by the
 * {@link RefreshTokenStore}; minted and rotated by `createRefreshRotation`.
 */
export interface StoredRefreshToken {
  /** SHA-256 hash (hex) of the opaque refresh token. Plaintext is never stored. */
  tokenHash: string;
  /** The `client_id` the token was issued to. */
  clientId: string;
  /** The authenticated end-user subject identifier. */
  subject: string;
  /** The scopes granted to this token. */
  scopes: string[];
  /** Unix timestamp (milliseconds) after which the token is invalid. */
  expiresAt: number;
  /**
   * Unix timestamp (milliseconds) when the token was rotated (consumed). A
   * consumed token that is presented again signals reuse (theft or a replay)
   * and triggers revocation of the owner's whole token set.
   */
  consumedAt?: number;
}

/**
 * App-provided store for refresh tokens, backing OAuth 2.1 rotation. The store
 * is pure persistence — the rotation mechanics (single-use, expiry, reuse
 * detection) live in `createRefreshRotation`. Back it with DynamoDB, Postgres,
 * in-memory, … The "owner" of a token is the `(clientId, subject)` pair.
 */
export interface RefreshTokenStore {
  /** Persist a refresh token, upserting by `tokenHash`. */
  save: (token: StoredRefreshToken) => Promise<void> | void;
  /** Look up a refresh token by its hash. Return `undefined` if unknown. */
  get: (
    tokenHash: string
  ) => Promise<StoredRefreshToken | undefined> | StoredRefreshToken | undefined;
  /** Remove a single refresh token by its hash. */
  delete: (tokenHash: string) => Promise<void> | void;
  /**
   * Remove every refresh token belonging to an owner. Called on reuse detection
   * to revoke the entire chain (the live token included), forcing re-auth.
   */
  deleteByOwner: (owner: {
    clientId: string;
    subject: string;
  }) => Promise<void> | void;
}

/**
 * A persisted opaque access token, stored by its hash (never the plaintext
 * value) so a store compromise does not leak usable tokens. The same shape
 * backs both OAuth access tokens and long-lived personal API keys; mint the
 * opaque value with `generateApiToken` and persist only its `tokenHash`.
 */
export interface StoredAccessToken {
  /** SHA-256 hash (hex) of the opaque token. Plaintext is never stored. */
  tokenHash: string;
  /** The `client_id` the token was issued to. */
  clientId: string;
  /** The authenticated end-user subject identifier. */
  subject: string;
  /** The scopes granted to the token. */
  scopes: string[];
  /**
   * Unix timestamp (milliseconds) after which the token is invalid, or `null`
   * for a token that never expires. `null` is an explicit opt-in for personal
   * API keys; OAuth access tokens should always set a short lifetime.
   */
  expiresAt: number | null;
  /** Unix timestamp (milliseconds) the token was last presented, for auditing. */
  lastUsedAt?: number;
  /**
   * Masked prefix safe to display in listing UIs (e.g. `"oca_3f2a…"`). Set at
   * issuance from `generateApiToken`'s return value; never recomputable from
   * the hash alone. Omit for tokens minted without a display prefix.
   */
  displayPrefix?: string;
  /**
   * Unix timestamp (milliseconds) when the token was created. Set at issuance;
   * used by listing UIs to show "created on" dates.
   */
  createdAt?: number;
}

/**
 * App-provided store for opaque access tokens, looked up by hash. The store is
 * pure persistence — the verification mechanics (expiry, default-deny) live in
 * `createAccessTokenVerifier`. Back it with DynamoDB, Postgres, in-memory, …
 *
 * Storing the hash, not the token, is a contract: a store compromise yields no
 * usable credentials. Revocation is first-class — `delete` kills one token;
 * `deleteBySubject` kills every token for a user (offboarding, compromise).
 */
export interface AccessTokenStore {
  /** Persist an access token, upserting by `tokenHash`. */
  save: (token: StoredAccessToken) => Promise<void> | void;
  /** Look up an access token by its hash. Return `undefined` if unknown. */
  get: (
    tokenHash: string
  ) => Promise<StoredAccessToken | undefined> | StoredAccessToken | undefined;
  /** Remove a single access token by its hash (revoke one session/key). */
  delete: (tokenHash: string) => Promise<void> | void;
  /**
   * Remove every access token for a subject. Called to revoke all of a user's
   * access at once on offboarding or suspected compromise.
   */
  deleteBySubject: (subject: string) => Promise<void> | void;
  /**
   * Record the time a token was last presented. Optional and fire-and-forget:
   * implementations MUST NOT block or fail verification on this write, and
   * SHOULD use a writable client (never a read-only replica).
   */
  touchLastUsed?: (args: {
    tokenHash: string;
    lastUsedAt: number;
  }) => Promise<void> | void;
  /**
   * Return every token belonging to a subject, for "your authorized
   * apps / personal API keys" listing UIs. Optional; `createMemoryAccessTokenStore`
   * implements this.
   */
  listBySubject?: (
    subject: string
  ) => Promise<StoredAccessToken[]> | StoredAccessToken[];
}

// ---------------------------------------------------------------------------
// Hook contracts (app-owned token minting, login/consent, refresh validation)
// ---------------------------------------------------------------------------

/** Tokens returned by the app's {@link OAuthServerOptions.issueTokens} hook. */
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

/** Arguments passed to {@link OAuthServerOptions.issueTokens}. */
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

/** Arguments passed to {@link OAuthServerOptions.onAuthorize}. */
export interface OnAuthorizeArgs {
  /** The resolved client making the request. */
  client: OAuthClient;
  /** The validated authorization request. */
  request: AuthorizeRequest;
  /**
   * The inbound request headers, so the app can read its own session cookie
   * to decide whether the user is authenticated. Runner-agnostic: there is no
   * framework context here.
   */
  headers: Record<string, string | undefined>;
}

/**
 * Result of the app's consent/login hook.
 *
 * `approved: true` issues a code and redirects back to the client. When the
 * user is not authenticated, return `approved: false` with a `redirect` to your
 * own login page (the adapter performs the redirect), or a `status`/`body` to
 * render an inline response.
 */
export type OnAuthorizeResult =
  | { approved: true; subject: string; scopes?: string[] }
  | { approved: false; redirect?: string; status?: number; body?: unknown };

/** Arguments passed to {@link OAuthServerOptions.onRefreshToken}. */
export interface OnRefreshTokenArgs {
  /** The refresh token presented by the client. */
  refreshToken: string;
  /** The authenticated client. */
  client: OAuthClient;
  /** Scopes requested in the refresh request (may be empty). */
  scopes: string[];
}

/** Result of validating a refresh token. Return `undefined` to reject. */
export type OnRefreshTokenResult =
  | { subject: string; scopes: string[] }
  | undefined;

/** Configuration for {@link createOAuthHandlers}. */
export interface OAuthServerOptions {
  /** The authorization server's issuer identifier (its base URL). */
  issuer: string;
  /** App-provided store for dynamic clients. */
  clientStore: ClientStore;
  /** App-provided store for short-lived authorization codes. */
  authCodeStore: AuthCodeStore;
  /**
   * App-owned token minting. The core never sees the user model or signing keys
   * — it hands you the subject/scopes/client and you return the tokens.
   */
  issueTokens: (args: IssueTokensArgs) => Promise<IssuedTokens> | IssuedTokens;
  /**
   * App-owned login/consent. Called on every authorize request; return the
   * authenticated subject to approve, or `{ approved: false, redirect }` to send
   * the user to your own login/consent UI.
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
   * When set, {@link OAuthHandlers.protectedResourceMetadata} is served, pairing
   * this resource URL with the issuer as its authorization server (RFC 9728).
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

/** The runner-agnostic OAuth server handlers returned by {@link createOAuthHandlers}. */
export interface OAuthHandlers {
  /** Resolved endpoint paths, for an adapter to mount routes on. */
  paths: { authorize: string; token: string; register: string };
  /** RFC 8414 Authorization Server Metadata response. */
  authorizationServerMetadata: () => OAuthResponse;
  /** RFC 9728 Protected Resource Metadata response, or `undefined` if `resource` is unset. */
  protectedResourceMetadata: () => OAuthResponse | undefined;
  /** Handle a `GET /authorize` request. */
  authorize: (request: OAuthRequest) => Promise<OAuthResponse>;
  /** Handle a `POST /token` request (authorization_code + refresh_token grants). */
  token: (request: OAuthRequest) => Promise<OAuthResponse>;
  /** Handle a `POST /register` request (Dynamic Client Registration, RFC 7591). */
  register: (request: OAuthRequest) => Promise<OAuthResponse>;
}
