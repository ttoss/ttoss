import { hashApiToken } from './apiToken';
import type { AccessTokenStore } from './oauthServerTypes';

/** The identity resolved from a valid access token. */
export interface VerifiedAccessToken {
  /** The authenticated end-user subject identifier. */
  subject: string;
  /** The scopes granted to the token. */
  scopes: string[];
  /** The `client_id` the token was issued to. */
  clientId: string;
}

/** Options for {@link createAccessTokenVerifier}. */
export interface AccessTokenVerifierOptions {
  /** App-provided persistence for access tokens. */
  store: AccessTokenStore;
  /**
   * Override the hashing applied to the presented token before lookup.
   * Defaults to SHA-256 (hex) — the same hash `generateApiToken` produces, so
   * tokens minted there verify with no extra wiring. The plaintext is never
   * stored or compared directly.
   */
  hashToken?: (token: string) => string;
  /**
   * When `true`, record `lastUsedAt` on every successful verification via
   * `store.touchLastUsed`. Fire-and-forget: the write never blocks the
   * verification result and a failure is swallowed.
   * @default false
   */
  touchLastUsed?: boolean;
}

/**
 * Builds a verifier for opaque, server-stored access tokens on top of an
 * {@link AccessTokenStore}. It hashes the presented bearer token, looks it up
 * by hash, and enforces:
 *
 * - **No plaintext** — only the hash crosses the store boundary, so neither the
 *   verifier nor the database ever holds a usable token.
 * - **Default-deny** — an unknown or expired token resolves to `null` without
 *   revealing whether it ever existed.
 * - **Expiry** — a token past `expiresAt` is rejected; `expiresAt: null` (a
 *   personal-API-key opt-in) skips the expiry check.
 *
 * The verify path is read-only by default; opt into `touchLastUsed` to record
 * usage as a fire-and-forget write. Revocation is immediate — a token removed
 * from the store (via `delete`/`deleteBySubject`) fails the very next call.
 *
 * @example
 * ```typescript
 * // Issue: mint opaque, persist only the hash.
 * const { token, tokenHash } = generateApiToken({ prefix: 'myapp' });
 * await store.save({ tokenHash, subject, scopes, clientId, expiresAt });
 *
 * // Verify (e.g. wired into an MCP/HTTP auth layer).
 * const verify = createAccessTokenVerifier({ store, touchLastUsed: true });
 * const identity = await verify(bearerToken); // VerifiedAccessToken | null
 * ```
 */
export const createAccessTokenVerifier = (
  options: AccessTokenVerifierOptions
): ((token: string) => Promise<VerifiedAccessToken | null>) => {
  const { store, hashToken = hashApiToken, touchLastUsed = false } = options;

  return async (token: string): Promise<VerifiedAccessToken | null> => {
    const tokenHash = hashToken(token);
    const stored = await store.get(tokenHash);

    // Unknown token: reject without leaking whether it ever existed.
    if (!stored) {
      return null;
    }

    // `expiresAt: null` never expires (personal-API-key opt-in).
    if (stored.expiresAt !== null && stored.expiresAt < Date.now()) {
      return null;
    }

    if (touchLastUsed && store.touchLastUsed) {
      // Fire-and-forget: never block or fail verification on the usage write.
      void Promise.resolve(
        store.touchLastUsed({ tokenHash, lastUsedAt: Date.now() })
      ).catch(() => {
        /* usage tracking is best-effort */
      });
    }

    return {
      subject: stored.subject,
      scopes: stored.scopes,
      clientId: stored.clientId,
    };
  };
};
