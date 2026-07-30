import type {
  AuthCodeStore,
  ClientStore,
  RefreshTokenStore,
} from '@ttoss/auth-core';

import type { OAuthModels } from './models';
import { createAuthCodeStore } from './stores/createAuthCodeStore';
import { createClientStore } from './stores/createClientStore';
import {
  createConsentStore,
  type PostgresdbConsentStore,
} from './stores/createConsentStore';
import { createRefreshTokenStore } from './stores/createRefreshTokenStore';

/** The durable OAuth stores returned by {@link createPostgresdbOAuthStores}. */
export interface PostgresdbOAuthStores {
  /** Dynamic client registrations, for `createOAuthHandlers`. */
  clientStore: ClientStore;
  /** Single-use authorization codes, stored by hash. */
  authCodeStore: AuthCodeStore;
  /** Consent handoff records for `createRedirectConsentOnAuthorize`. */
  consentStore: PostgresdbConsentStore;
  /** Tracked refresh tokens, for `createRefreshRotation`. */
  refreshTokenStore: RefreshTokenStore;
}

/**
 * Creates every durable OAuth store from a `@ttoss/postgresdb` `db` handle.
 *
 * The stores are mechanical adapters between the `@ttoss/auth-core` store
 * contracts and Sequelize, so an app that already uses `@ttoss/postgresdb` does
 * not have to write them — nor reach around its own ORM to inject a raw `pg`
 * query runner.
 *
 * @example
 * ```typescript
 * import { createPostgresdbOAuthStores, oauthModels } from '@ttoss/auth-postgresdb';
 * import { initialize } from '@ttoss/postgresdb';
 *
 * const db = await initialize({ models: { ...oauthModels, User } });
 *
 * const { clientStore, authCodeStore, consentStore, refreshTokenStore } =
 *   createPostgresdbOAuthStores({ db });
 * ```
 */
export const createPostgresdbOAuthStores = ({
  db,
}: {
  /**
   * The handle returned by `@ttoss/postgresdb`'s `initialize`, with
   * `oauthModels` among its registered models.
   */
  db: OAuthModels;
}): PostgresdbOAuthStores => {
  return {
    clientStore: createClientStore({ model: db.OAuthClient }),
    authCodeStore: createAuthCodeStore({ model: db.OAuthAuthCode }),
    consentStore: createConsentStore({ model: db.OAuthConsent }),
    refreshTokenStore: createRefreshTokenStore({
      model: db.OAuthRefreshToken,
    }),
  };
};
