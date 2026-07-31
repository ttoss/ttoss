import type { OAuthConsent } from 'src/models/OAuthConsent';
import { createConsentStore } from 'src/stores/createConsentStore';

const setup = () => {
  const model = {
    findByPk: jest.fn(),
    upsert: jest.fn(),
    destroy: jest.fn(),
  };
  const store = createConsentStore({
    model: model as unknown as typeof OAuthConsent,
  });
  return { model, store };
};

const EXPIRES_AT = 1_700_000_300_000;

test('records an approval against the PKCE challenge', async () => {
  const { model, store } = setup();

  await store.saveConsentGrant({
    codeChallenge: 'challenge',
    subject: 'user-1',
    scopes: ['mcp:access'],
    expiresAt: EXPIRES_AT,
  });

  expect(model.upsert).toHaveBeenCalledWith({
    codeChallenge: 'challenge',
    subject: 'user-1',
    scopes: ['mcp:access'],
    expiresAt: new Date(EXPIRES_AT),
  });
});

test('reads a grant back with epoch-millisecond expiry', async () => {
  const { model, store } = setup();
  model.findByPk.mockResolvedValue({
    codeChallenge: 'challenge',
    subject: 'user-1',
    scopes: ['mcp:access'],
    expiresAt: new Date(EXPIRES_AT),
  });

  await expect(
    store.getConsentGrant({ codeChallenge: 'challenge' })
  ).resolves.toEqual({
    subject: 'user-1',
    scopes: ['mcp:access'],
    expiresAt: EXPIRES_AT,
  });
});

test('resolves undefined when no consent was recorded', async () => {
  const { model, store } = setup();
  model.findByPk.mockResolvedValue(null);

  await expect(
    store.getConsentGrant({ codeChallenge: 'challenge' })
  ).resolves.toBeUndefined();
});

test('deletes a consumed grant to keep it single-use', async () => {
  const { model, store } = setup();

  await store.deleteConsentGrant({ codeChallenge: 'challenge' });

  expect(model.destroy).toHaveBeenCalledWith({
    where: { codeChallenge: 'challenge' },
  });
});
