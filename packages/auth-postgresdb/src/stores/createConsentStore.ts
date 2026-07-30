import type { ConsentGrant, ConsentGrantStore } from '@ttoss/auth-core';

import type { OAuthConsent } from '../models/OAuthConsent';

/** A {@link ConsentGrantStore} plus the write side an app's consent page needs. */
export interface PostgresdbConsentStore extends ConsentGrantStore {
  /**
   * Record an approval so the restarted `/authorize` request can consume it.
   * Call this from the consent page's approve handler, before navigating back
   * to the authorization server's `/authorize`.
   */
  saveConsentGrant: (
    grant: ConsentGrant & { codeChallenge: string }
  ) => Promise<void>;
}

/**
 * Creates a consent store backed by the `oauth_consents` table, for use with
 * `createRedirectConsentOnAuthorize`.
 *
 * Reads and deletes satisfy `ConsentGrantStore`; `saveConsentGrant` covers the
 * write the consent page performs. Grants are single-use — the `onAuthorize`
 * hook deletes each one as it consumes it.
 */
export const createConsentStore = ({
  model,
}: {
  /** The `OAuthConsent` model class, taken from the app's `db` handle. */
  model: typeof OAuthConsent;
}): PostgresdbConsentStore => {
  return {
    saveConsentGrant: async ({ codeChallenge, subject, scopes, expiresAt }) => {
      await model.upsert({
        codeChallenge,
        subject,
        scopes,
        expiresAt: new Date(expiresAt),
      });
    },

    getConsentGrant: async ({ codeChallenge }) => {
      const row = await model.findByPk(codeChallenge);

      if (!row) {
        return undefined;
      }

      return {
        subject: row.subject,
        scopes: row.scopes,
        expiresAt: row.expiresAt.getTime(),
      };
    },

    deleteConsentGrant: async ({ codeChallenge }) => {
      await model.destroy({ where: { codeChallenge } });
    },
  };
};
