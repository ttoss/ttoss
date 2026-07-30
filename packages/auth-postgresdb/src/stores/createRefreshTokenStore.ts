import type { RefreshTokenStore } from '@ttoss/auth-core';

import type { OAuthRefreshToken } from '../models/OAuthRefreshToken';

/**
 * Creates a {@link RefreshTokenStore} backed by the `oauth_refresh_tokens`
 * table, keyed by token hash and by the `(clientId, subject)` owner that
 * `deleteByOwner` revokes on reuse detection.
 */
export const createRefreshTokenStore = ({
  model,
}: {
  /** The `OAuthRefreshToken` model class, taken from the app's `db` handle. */
  model: typeof OAuthRefreshToken;
}): RefreshTokenStore => {
  return {
    save: async (token) => {
      await model.upsert({
        tokenHash: token.tokenHash,
        clientId: token.clientId,
        subject: token.subject,
        scopes: token.scopes,
        expiresAt: new Date(token.expiresAt),
        consumedAt:
          token.consumedAt === undefined ? null : new Date(token.consumedAt),
      });
    },

    get: async (tokenHash) => {
      const row = await model.findByPk(tokenHash);

      if (!row) {
        return undefined;
      }

      return {
        tokenHash: row.tokenHash,
        clientId: row.clientId,
        subject: row.subject,
        scopes: row.scopes,
        expiresAt: row.expiresAt.getTime(),
        /**
         * The key is omitted, not set to `null`. Rotation tests
         * `stored.consumedAt !== undefined` to detect reuse, and a nullable
         * timestamp column reads back as `null` — which would make every live
         * token look consumed, so the first refresh would be treated as a
         * replay and revoke the owner's entire token set.
         */
        ...(row.consumedAt !== null && {
          consumedAt: row.consumedAt.getTime(),
        }),
      };
    },

    delete: async (tokenHash) => {
      await model.destroy({ where: { tokenHash } });
    },

    deleteByOwner: async ({ clientId, subject }) => {
      await model.destroy({ where: { clientId, subject } });
    },
  };
};
