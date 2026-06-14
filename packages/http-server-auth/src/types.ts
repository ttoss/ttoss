import type { Context } from '@ttoss/http-server';

export type AuthenticatedUser = {
  id: string;
  email?: string;
  [key: string]: unknown;
};

export type AuthStrategy = 'jwt' | 'apiToken' | 'system';

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

export type AuthMiddlewareOptions = {
  /** Ordered list of strategies to attempt. First match wins. */
  strategies: AuthStrategy[];
  jwt?: JwtOptions;
  apiToken?: ApiTokenOptions;
  system?: SystemOptions;
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
