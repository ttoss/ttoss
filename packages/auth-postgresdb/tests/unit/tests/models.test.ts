import { Sequelize } from '@ttoss/postgresdb';
import { oauthModels } from 'dist/index';

/**
 * Registers the models against a Sequelize instance that never connects, which
 * is enough to assert the schema the `ttoss-postgresdb sync` CLI will create.
 */
const sequelize = new Sequelize({
  dialect: 'postgres',
  logging: false,
  define: { underscored: true },
  models: Object.values(oauthModels),
});

afterAll(async () => {
  await sequelize.close();
});

test('registers every OAuth model on the app connection', () => {
  expect(Object.keys(oauthModels)).toEqual([
    'OAuthAuthCode',
    'OAuthClient',
    'OAuthConsent',
    'OAuthRefreshToken',
  ]);
});

test.each([
  [oauthModels.OAuthAuthCode, 'oauth_auth_codes', 'codeHash'],
  [oauthModels.OAuthClient, 'oauth_clients', 'clientId'],
  [oauthModels.OAuthConsent, 'oauth_consents', 'codeChallenge'],
  [oauthModels.OAuthRefreshToken, 'oauth_refresh_tokens', 'tokenHash'],
])('%# maps to table %s keyed by %s', (model, tableName, primaryKey) => {
  expect(model.getTableName()).toBe(tableName);
  expect(model.primaryKeyAttributes).toEqual([primaryKey]);
});

test('stores hashes, never plaintext codes or tokens', () => {
  expect(Object.keys(oauthModels.OAuthAuthCode.getAttributes())).not.toContain(
    'code'
  );
  expect(
    Object.keys(oauthModels.OAuthRefreshToken.getAttributes())
  ).not.toContain('token');
});

test('underscores column names so the schema is snake_case', () => {
  expect(oauthModels.OAuthRefreshToken.getAttributes().consumedAt?.field).toBe(
    'consumed_at'
  );
  expect(oauthModels.OAuthClient.getAttributes().redirectUris?.field).toBe(
    'redirect_uris'
  );
});

test('exposes attributes through Sequelize, unshadowed by class fields', () => {
  const instance = oauthModels.OAuthRefreshToken.build({
    tokenHash: 'hash-1',
    clientId: 'client-1',
    subject: 'user-1',
    scopes: ['mcp:access'],
    expiresAt: new Date(1_700_000_000_000),
    consumedAt: null,
  });

  expect(instance.tokenHash).toBe('hash-1');
  expect(instance.scopes).toEqual(['mcp:access']);
  expect(instance.consumedAt).toBeNull();
});

test('keeps a live refresh token consumedAt nullable', () => {
  expect(
    oauthModels.OAuthRefreshToken.getAttributes().consumedAt?.allowNull
  ).toBe(true);
  expect(
    oauthModels.OAuthRefreshToken.getAttributes().expiresAt?.allowNull
  ).toBe(false);
});
