import type { AuthCodeStore } from '@ttoss/auth-core';
import { hashAuthorizationCode } from '@ttoss/auth-core';

import type { OAuthAuthCode } from '../models/OAuthAuthCode';

/**
 * Creates an {@link AuthCodeStore} backed by the `oauth_auth_codes` table,
 * storing codes by SHA-256 hash.
 *
 * The engine hands the store the plaintext code on every call and never compares
 * the returned `code` against anything — it reads only `clientId`,
 * `redirectUri`, `codeChallenge`, `scopes`, `subject`, and `expiresAt`. So the
 * adapter hashes to find the row and echoes the presented value back, and a
 * database dump yields no replayable codes.
 */
export const createAuthCodeStore = ({
  model,
}: {
  /** The `OAuthAuthCode` model class, taken from the app's `db` handle. */
  model: typeof OAuthAuthCode;
}): AuthCodeStore => {
  return {
    save: async (code) => {
      await model.upsert({
        codeHash: hashAuthorizationCode({ code: code.code }),
        clientId: code.clientId,
        redirectUri: code.redirectUri,
        codeChallenge: code.codeChallenge,
        scopes: code.scopes,
        subject: code.subject,
        expiresAt: new Date(code.expiresAt),
      });
    },

    get: async (code) => {
      const row = await model.findByPk(hashAuthorizationCode({ code }));

      if (!row) {
        return undefined;
      }

      return {
        code,
        clientId: row.clientId,
        redirectUri: row.redirectUri,
        codeChallenge: row.codeChallenge,
        scopes: row.scopes,
        subject: row.subject,
        expiresAt: row.expiresAt.getTime(),
      };
    },

    delete: async (code) => {
      await model.destroy({
        where: { codeHash: hashAuthorizationCode({ code }) },
      });
    },
  };
};
