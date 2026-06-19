import type { Context } from '@ttoss/http-server';

export type AuthenticatedUser = {
  id: string;
  email?: string;
  [key: string]: unknown;
};

export type AuthStrategy = 'jwt' | 'apiToken' | 'system' | 'oauth';

export type JwtOptions = {
  secret: string;
  /**
   * Override how the JWT payload maps to an AuthenticatedUser.
   * Defaults to `{ id: payload.sub, email: payload.email }`.
   *
   * Receives the Koa `ctx` as a second argument so the mapping can do
   * request-scoped work (e.g. reading from `ctx.db`).
   */
  mapPayload?: (
    payload: Record<string, unknown>,
    ctx: Context
  ) => AuthenticatedUser | null;
};

export type ApiTokenOptions = {
  /**
   * Receives the SHA-256 hash of the presented token and returns the
   * authenticated user, or null if not found / revoked.
   *
   * Receives the Koa `ctx` as a second argument so the lookup can do
   * request-scoped work (e.g. bumping `lastUsedAt` or reading `ctx.db`).
   */
  lookup: (
    tokenHash: string,
    ctx: Context
  ) => Promise<AuthenticatedUser | null>;
};

export type SystemOptions = {
  secret: string;
  /** User attached to ctx.state.user for system calls. */
  user: AuthenticatedUser;
};

export type OAuthOptions = {
  /**
   * Verifies a Bearer token issued by an OAuth provider (Cognito, Auth0,
   * Keycloak, your own authorization server, …). Resolve with the verified
   * payload, return `null`, or throw to reject — both rejection forms yield a
   * `401`. Wrap a provider SDK here (e.g. `CognitoJwtVerifier` from
   * `@ttoss/auth-core/amazon-cognito`) to keep this package provider-agnostic.
   *
   * Receives the Koa `ctx` as a second argument for request-scoped work.
   */
  verify: (
    token: string,
    ctx: Context
  ) => Promise<Record<string, unknown> | null> | Record<string, unknown> | null;
  /**
   * Maps the verified payload to an AuthenticatedUser. Defaults to the payload
   * itself with `id` taken from `sub`, so claims like `scope` remain available
   * on `ctx.state.user`.
   */
  mapPayload?: (
    payload: Record<string, unknown>,
    ctx: Context
  ) => AuthenticatedUser | null;
  /**
   * Scopes that must all be present on the token, else `403`.
   * `verify` may return either `scope: string` (space-separated JWT claim) or
   * `scopes: string[]`; both are normalised internally. If neither is present
   * and `requiredScopes` is non-empty, a warning is logged and `403` is returned.
   */
  requiredScopes?: string[];
};

export type AuthMiddlewareOptions = {
  /** Ordered list of strategies to attempt. First match wins. */
  strategies: AuthStrategy[];
  jwt?: JwtOptions;
  apiToken?: ApiTokenOptions;
  system?: SystemOptions;
  oauth?: OAuthOptions;
  /**
   * When set, a `401` response carries
   * `WWW-Authenticate: Bearer resource_metadata="<url>"` (RFC 9728) so OAuth
   * clients can discover the authorization server. Otherwise a bare `Bearer`.
   */
  resourceMetadataUrl?: string;
  /**
   * Optional origin allowlist. Strings are exact-matched; RegExps are tested.
   * Requests without an Origin header are never rejected by this check.
   */
  allowedOrigins?: Array<string | RegExp | undefined>;
  /**
   * When true (default), unauthenticated requests receive 401.
   * When false, they pass through with ctx.state.user === undefined.
   */
  required?: boolean;
};
