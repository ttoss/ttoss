import type {
  PendingAuthorization,
  PendingAuthorizationStore,
} from '@ttoss/auth-core';

import type { OAuthPendingAuthorization } from '../models/OAuthPendingAuthorization';

const toPendingAuthorization = (
  row: OAuthPendingAuthorization
): PendingAuthorization => {
  return {
    id: row.id,
    clientId: row.clientId,
    redirectUri: row.redirectUri,
    scopes: row.scopes,
    state: row.state ?? undefined,
    codeChallenge: row.codeChallenge,
    codeChallengeMethod: row.codeChallengeMethod,
    resource: row.resource ?? undefined,
    expiresAt: row.expiresAt.getTime(),
    approval:
      row.approvedSubject === null
        ? undefined
        : {
            subject: row.approvedSubject,
            scopes: row.approvedScopes ?? [],
            resumeSecretHash: row.resumeSecretHash ?? '',
          },
  };
};

/**
 * Creates a {@link PendingAuthorizationStore} backed by the
 * `oauth_pending_authorizations` table, for `createPendingConsentOnAuthorize`.
 *
 * `approve` is one conditional `UPDATE`, and `consume` hands the row only to
 * the caller whose `DELETE` removed it, so concurrent approvals or resumes
 * never both succeed. `delete`, which auth-core calls only to deny, leaves an
 * approved row alone.
 */
export const createPendingAuthorizationStore = ({
  model,
}: {
  /** The `OAuthPendingAuthorization` model class, from the app's `db` handle. */
  model: typeof OAuthPendingAuthorization;
}): PendingAuthorizationStore => {
  return {
    save: async (pending) => {
      await model.create({
        id: pending.id,
        clientId: pending.clientId,
        redirectUri: pending.redirectUri,
        scopes: pending.scopes,
        state: pending.state ?? null,
        codeChallenge: pending.codeChallenge,
        codeChallengeMethod: pending.codeChallengeMethod,
        resource: pending.resource ?? null,
        expiresAt: new Date(pending.expiresAt),
      });
    },

    get: async (id) => {
      const row = await model.findByPk(id);
      return row ? toPendingAuthorization(row) : undefined;
    },

    approve: async ({ id, approval }) => {
      const [updated] = await model.update(
        {
          approvedSubject: approval.subject,
          approvedScopes: approval.scopes,
          resumeSecretHash: approval.resumeSecretHash,
        },
        { where: { id, approvedSubject: null } }
      );
      return updated > 0;
    },

    consume: async (id) => {
      const row = await model.findByPk(id);
      if (!row) {
        return undefined;
      }
      const deleted = await model.destroy({ where: { id } });
      return deleted > 0 ? toPendingAuthorization(row) : undefined;
    },

    delete: async (id) => {
      await model.destroy({ where: { id, approvedSubject: null } });
    },
  };
};
