import { createPostgresdbOAuthStores } from 'src/createPostgresdbOAuthStores';
import type { OAuthModels } from 'src/models';

const model = (name: string) => {
  return {
    name,
    findByPk: jest.fn(),
    upsert: jest.fn(),
    destroy: jest.fn(),
  };
};

const db = {
  OAuthAuthCode: model('OAuthAuthCode'),
  OAuthClient: model('OAuthClient'),
  OAuthConsent: model('OAuthConsent'),
  OAuthRefreshToken: model('OAuthRefreshToken'),
};

const stores = createPostgresdbOAuthStores({
  db: db as unknown as OAuthModels,
});

test('returns every store createOAuthHandlers and rotation need', () => {
  expect(Object.keys(stores).sort()).toEqual([
    'authCodeStore',
    'clientStore',
    'consentStore',
    'refreshTokenStore',
  ]);
});

test('wires each store to its own model', async () => {
  await stores.clientStore.get('client-1');
  await stores.consentStore.getConsentGrant({ codeChallenge: 'challenge' });
  await stores.refreshTokenStore.get('hash-1');
  await stores.authCodeStore.get('code-1');

  expect(db.OAuthClient.findByPk).toHaveBeenCalledWith('client-1');
  expect(db.OAuthConsent.findByPk).toHaveBeenCalledWith('challenge');
  expect(db.OAuthRefreshToken.findByPk).toHaveBeenCalledWith('hash-1');
  expect(db.OAuthAuthCode.findByPk).toHaveBeenCalledTimes(1);
});
