import type {
  ConsentGrant,
  ConsentGrantStore,
} from './redirectConsentOnAuthorize';

/**
 * Minimal query interface compatible with both `pg` Pool.query and
 * `@ttoss/lambda-postgres-query`'s `query` function. The caller injects
 * whichever runner they use; `@ttoss/auth-core` has no database dependency.
 */
export type ConsentStoreQuery = <
  Row extends Record<string, unknown> = Record<string, unknown>,
>(params: {
  text: string;
  values?: unknown[];
}) => Promise<{ rows: Row[] }>;

/**
 * Options for {@link createPostgresConsentStore}.
 */
export type CreatePostgresConsentStoreOptions = {
  /** Injected Postgres query runner. */
  query: ConsentStoreQuery;
  /**
   * Table name for consent grants.
   * @default 'oauth_consent_grants'
   */
  tableName?: string;
};

type ConsentGrantRow = {
  subject: string;
  /** Space-separated scope string as stored in the database. */
  scopes: string;
  /** ISO timestamp or epoch milliseconds as a string. */
  expires_at: string;
};

/**
 * Creates a {@link ConsentGrantStore} backed by a Postgres table.
 *
 * Expected table schema:
 * ```sql
 * CREATE TABLE oauth_consent_grants (
 *   code_challenge  TEXT PRIMARY KEY,
 *   subject         TEXT        NOT NULL,
 *   scopes          TEXT        NOT NULL,
 *   expires_at      TIMESTAMPTZ NOT NULL
 * );
 * ```
 *
 * The `query` parameter is injected so the caller can use any runner
 * (`pg` Pool, `@ttoss/lambda-postgres-query`, etc.).
 */
export const createPostgresConsentStore = ({
  query,
  tableName = 'oauth_consent_grants',
}: CreatePostgresConsentStoreOptions): ConsentGrantStore => {
  return {
    getConsentGrant: async ({ codeChallenge }) => {
      const result = await query<ConsentGrantRow>({
        text: `SELECT subject, scopes, expires_at FROM ${tableName} WHERE code_challenge = $1`,
        values: [codeChallenge],
      });

      const row = result.rows[0];
      if (!row) return undefined;

      return {
        subject: row.subject,
        scopes: row.scopes.split(' ').filter(Boolean),
        expiresAt: new Date(row.expires_at).getTime(),
      } satisfies ConsentGrant;
    },

    deleteConsentGrant: async ({ codeChallenge }) => {
      await query({
        text: `DELETE FROM ${tableName} WHERE code_challenge = $1`,
        values: [codeChallenge],
      });
    },
  };
};
