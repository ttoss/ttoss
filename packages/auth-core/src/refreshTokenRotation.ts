import { createHash, randomBytes } from 'node:crypto';

import type {
  OAuthClient,
  OnRefreshTokenArgs,
  OnRefreshTokenResult,
  RefreshTokenStore,
} from './oauthServerTypes';

/** Default refresh-token lifetime: 30 days. */
const DEFAULT_REFRESH_TOKEN_TTL = 60 * 60 * 24 * 30;

const base64Url = (buffer: Buffer): string => {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

const defaultGenerateToken = (): string => {
  return base64Url(randomBytes(32));
};

const defaultHashToken = (token: string): string => {
  return createHash('sha256').update(token).digest('hex');
};

const isSubset = (requested: string[], granted: string[]): boolean => {
  const grantedSet = new Set(granted);
  return requested.every((scope) => {
    return grantedSet.has(scope);
  });
};

/** Configuration for {@link createRefreshRotation}. */
export interface RefreshRotationOptions {
  /** App-provided persistence for refresh tokens. */
  store: RefreshTokenStore;
  /**
   * Refresh-token lifetime in seconds.
   * @default 2592000 (30 days)
   */
  refreshTokenTtl?: number;
  /**
   * Override the opaque-token generator. Defaults to 32 random bytes,
   * base64url-encoded. Useful for deterministic tests.
   */
  generateToken?: () => string;
  /**
   * Override the token hashing function used before persistence. Defaults to
   * SHA-256 (hex). The plaintext token is never stored.
   */
  hashToken?: (token: string) => string;
}

/** Arguments for {@link RefreshRotation.issue}. */
export interface IssueRefreshTokenArgs {
  /** The client the token is issued to. */
  client: OAuthClient;
  /** The authenticated end-user subject identifier. */
  subject: string;
  /** The scopes granted to the token. */
  scopes: string[];
}

/** The refresh-rotation helpers returned by {@link createRefreshRotation}. */
export interface RefreshRotation {
  /**
   * Mint and persist a new opaque refresh token, returning the plaintext value
   * to hand back to the client. Call this from your `issueTokens` hook so every
   * issued refresh token is tracked for rotation.
   */
  issue: (args: IssueRefreshTokenArgs) => Promise<string>;
  /**
   * A ready `onRefreshToken` implementation: validates the presented token,
   * enforces single use, expiry, and per-owner reuse detection, then approves
   * the refresh. Pass it straight to `createOAuthHandlers`.
   */
  onRefreshToken: (args: OnRefreshTokenArgs) => Promise<OnRefreshTokenResult>;
}

/**
 * Builds a backend-agnostic refresh-token rotation engine on top of a
 * {@link RefreshTokenStore}. It implements the OAuth 2.1 rotation mechanics that
 * are easy to get wrong by hand:
 *
 * - **Single use** — a refresh token is consumed (marked rotated) the first
 *   time it is exchanged; a new one is minted by your `issueTokens` hook.
 * - **Reuse detection** — presenting an already-consumed token signals theft or
 *   replay, so the owner's *entire* token set is revoked, forcing re-auth.
 * - **Expiry** — tokens past their TTL are rejected and swept on access.
 * - **Scope narrowing** — a refresh request may request a subset of the granted
 *   scopes; requesting a superset is rejected.
 *
 * The "owner" of a token is the `(clientId, subject)` pair, which is the unit
 * revoked on reuse. Plaintext tokens are never persisted — only their hash.
 *
 * @example
 * ```typescript
 * const refresh = createRefreshRotation({ store });
 * createOAuthHandlers({
 *   // …,
 *   issueTokens: async ({ subject, scopes, client }) => ({
 *     accessToken: signJwt({ sub: subject, scope: scopes.join(' ') }),
 *     refreshToken: await refresh.issue({ client, subject, scopes }),
 *     expiresIn: 3600,
 *   }),
 *   onRefreshToken: refresh.onRefreshToken,
 * });
 * ```
 */
export const createRefreshRotation = (
  options: RefreshRotationOptions
): RefreshRotation => {
  const {
    store,
    refreshTokenTtl = DEFAULT_REFRESH_TOKEN_TTL,
    generateToken = defaultGenerateToken,
    hashToken = defaultHashToken,
  } = options;

  const issue = async (args: IssueRefreshTokenArgs): Promise<string> => {
    const token = generateToken();
    await store.save({
      tokenHash: hashToken(token),
      clientId: args.client.client_id,
      subject: args.subject,
      scopes: args.scopes,
      expiresAt: Date.now() + refreshTokenTtl * 1000,
    });
    return token;
  };

  const onRefreshToken = async (
    args: OnRefreshTokenArgs
  ): Promise<OnRefreshTokenResult> => {
    const tokenHash = hashToken(args.refreshToken);
    const stored = await store.get(tokenHash);

    // Unknown token: reject without leaking whether it ever existed.
    if (!stored) {
      return undefined;
    }

    // Reuse of a rotated token: revoke the whole chain for this owner.
    if (stored.consumedAt !== undefined) {
      await store.deleteByOwner({
        clientId: stored.clientId,
        subject: stored.subject,
      });
      return undefined;
    }

    if (stored.expiresAt < Date.now()) {
      await store.delete(tokenHash);
      return undefined;
    }

    // A token may only be refreshed by the client it was issued to.
    if (stored.clientId !== args.client.client_id) {
      return undefined;
    }

    // The refresh may narrow scopes, but never broaden them (RFC 6749 §6).
    let scopes = stored.scopes;
    if (args.scopes.length > 0) {
      if (!isSubset(args.scopes, stored.scopes)) {
        return undefined;
      }
      scopes = args.scopes;
    }

    // Consume the token: rotation issues a fresh one via `issueTokens`.
    await store.save({ ...stored, consumedAt: Date.now() });

    return { subject: stored.subject, scopes };
  };

  return { issue, onRefreshToken };
};
