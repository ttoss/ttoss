import { hashAuthorizationCode } from '@ttoss/auth-core';
import type { OAuthAuthCode } from 'src/models/OAuthAuthCode';
import { createAuthCodeStore } from 'src/stores/createAuthCodeStore';

const setup = () => {
  const model = {
    findByPk: jest.fn(),
    upsert: jest.fn(),
    destroy: jest.fn(),
  };
  const store = createAuthCodeStore({
    model: model as unknown as typeof OAuthAuthCode,
  });
  return { model, store };
};

const CODE = 'plaintext-authorization-code';
const CODE_HASH = hashAuthorizationCode({ code: CODE });
const EXPIRES_AT = 1_700_000_600_000;

test('persists the code hash, never the code itself', async () => {
  const { model, store } = setup();

  await store.save({
    code: CODE,
    clientId: 'client-1',
    redirectUri: 'https://claude.ai/callback',
    codeChallenge: 'challenge',
    scopes: ['mcp:access'],
    subject: 'user-1',
    expiresAt: EXPIRES_AT,
  });

  expect(model.upsert).toHaveBeenCalledWith({
    codeHash: CODE_HASH,
    clientId: 'client-1',
    redirectUri: 'https://claude.ai/callback',
    codeChallenge: 'challenge',
    scopes: ['mcp:access'],
    subject: 'user-1',
    expiresAt: new Date(EXPIRES_AT),
  });
  expect(JSON.stringify(model.upsert.mock.calls[0])).not.toContain(CODE);
});

test('looks the row up by hash and echoes the presented code back', async () => {
  const { model, store } = setup();
  model.findByPk.mockResolvedValue({
    codeHash: CODE_HASH,
    clientId: 'client-1',
    redirectUri: 'https://claude.ai/callback',
    codeChallenge: 'challenge',
    scopes: ['mcp:access'],
    subject: 'user-1',
    expiresAt: new Date(EXPIRES_AT),
  });

  await expect(store.get(CODE)).resolves.toEqual({
    code: CODE,
    clientId: 'client-1',
    redirectUri: 'https://claude.ai/callback',
    codeChallenge: 'challenge',
    scopes: ['mcp:access'],
    subject: 'user-1',
    expiresAt: EXPIRES_AT,
  });
  expect(model.findByPk).toHaveBeenCalledWith(CODE_HASH);
});

test('resolves undefined for an unknown code', async () => {
  const { model, store } = setup();
  model.findByPk.mockResolvedValue(null);

  await expect(store.get(CODE)).resolves.toBeUndefined();
});

test('deletes by hash to enforce single use', async () => {
  const { model, store } = setup();

  await store.delete(CODE);

  expect(model.destroy).toHaveBeenCalledWith({
    where: { codeHash: CODE_HASH },
  });
});
