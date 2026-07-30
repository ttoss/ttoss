import { OAuthAuthCode } from './OAuthAuthCode';
import { OAuthClient } from './OAuthClient';
import { OAuthConsent } from './OAuthConsent';
import { OAuthRefreshToken } from './OAuthRefreshToken';

/**
 * The OAuth data model, ready to register alongside the application's own
 * models so `ttoss-postgresdb sync` and `erd` cover these tables like any
 * other instead of them being a side-channel schema the CLI cannot see.
 *
 * @example
 * ```typescript
 * import { oauthModels } from '@ttoss/auth-postgresdb';
 * import { initialize } from '@ttoss/postgresdb';
 *
 * export const db = await initialize({ models: { ...oauthModels, User } });
 * ```
 */
export const oauthModels = {
  OAuthAuthCode,
  OAuthClient,
  OAuthConsent,
  OAuthRefreshToken,
};

/** The shape a `db` handle must have to back the OAuth stores. */
export type OAuthModels = typeof oauthModels;

export { OAuthAuthCode, OAuthClient, OAuthConsent, OAuthRefreshToken };
