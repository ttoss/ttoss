import { hashClientSecret } from '@ttoss/auth-core';
import type { OAuthClient } from 'src/models/OAuthClient';
import { createClientStore } from 'src/stores/createClientStore';

const createModelDouble = () => {
  return {
    findByPk: jest.fn(),
    upsert: jest.fn(),
    destroy: jest.fn(),
  };
};

type ModelDouble = ReturnType<typeof createModelDouble>;

const setup = () => {
  const model = createModelDouble();
  const store = createClientStore({
    model: model as unknown as typeof OAuthClient,
  });
  return { model, store };
};

const row = (overrides: Partial<Record<string, unknown>> = {}) => {
  return {
    clientId: 'client-1',
    clientSecretHash: hashClientSecret({ clientSecret: 'secret' }),
    clientName: 'Claude',
    redirectUris: ['https://claude.ai/callback'],
    grantTypes: ['authorization_code', 'refresh_token'],
    responseTypes: ['code'],
    tokenEndpointAuthMethod: 'client_secret_post',
    scope: 'mcp:access',
    clientIdIssuedAt: 1700000000,
    metadata: { logo_uri: 'https://claude.ai/logo.png' },
    ...overrides,
  };
};

const upsertedBy = (model: ModelDouble) => {
  return model.upsert.mock.calls[0]?.[0] as Record<string, unknown>;
};

test('rebuilds the registration document from its columns', async () => {
  const { model, store } = setup();
  model.findByPk.mockResolvedValue(row());

  await expect(store.get('client-1')).resolves.toEqual({
    client_id: 'client-1',
    client_name: 'Claude',
    redirect_uris: ['https://claude.ai/callback'],
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
    token_endpoint_auth_method: 'client_secret_post',
    scope: 'mcp:access',
    client_id_issued_at: 1700000000,
    logo_uri: 'https://claude.ai/logo.png',
  });
  expect(model.findByPk).toHaveBeenCalledWith('client-1');
});

test('omits absent optional fields instead of reporting them as null', async () => {
  const { model, store } = setup();
  model.findByPk.mockResolvedValue(
    row({
      clientSecretHash: null,
      clientName: null,
      grantTypes: null,
      responseTypes: null,
      tokenEndpointAuthMethod: null,
      scope: null,
      clientIdIssuedAt: null,
      metadata: {},
    })
  );

  await expect(store.get('client-1')).resolves.toEqual({
    client_id: 'client-1',
    redirect_uris: ['https://claude.ai/callback'],
  });
});

test('reads a BIGINT client_id_issued_at back as a number', async () => {
  const { model, store } = setup();
  model.findByPk.mockResolvedValue(row({ clientIdIssuedAt: '1700000000' }));

  const client = await store.get('client-1');

  expect(client?.client_id_issued_at).toBe(1700000000);
});

test('resolves undefined for an unknown client', async () => {
  const { model, store } = setup();
  model.findByPk.mockResolvedValue(null);

  await expect(store.get('nope')).resolves.toBeUndefined();
});

test('registers a public client without a secret', async () => {
  const { model, store } = setup();

  await store.register({
    client_id: 'client-2',
    redirect_uris: ['https://cursor.sh/callback'],
    token_endpoint_auth_method: 'none',
  });

  expect(upsertedBy(model)).toEqual({
    clientId: 'client-2',
    clientSecretHash: null,
    clientName: null,
    redirectUris: ['https://cursor.sh/callback'],
    grantTypes: null,
    responseTypes: null,
    tokenEndpointAuthMethod: 'none',
    scope: null,
    clientIdIssuedAt: null,
    metadata: {},
  });
});

test('keeps unregistered metadata fields verbatim', async () => {
  const { model, store } = setup();

  await store.register({
    client_id: 'client-3',
    redirect_uris: ['https://example.com/callback'],
    client_name: 'Example',
    client_uri: 'https://example.com',
    software_id: 'abc',
  });

  expect(upsertedBy(model).metadata).toEqual({
    client_uri: 'https://example.com',
    software_id: 'abc',
  });
  expect(upsertedBy(model).clientName).toBe('Example');
});

test('stores the client secret hashed, never in plaintext', async () => {
  const { model, store } = setup();

  await store.register({
    client_id: 'client-4',
    client_secret: 'super-secret',
    redirect_uris: ['https://example.com/callback'],
  });

  const upserted = upsertedBy(model);

  expect(upserted.clientSecretHash).toBe(
    hashClientSecret({ clientSecret: 'super-secret' })
  );
  expect(JSON.stringify(upserted)).not.toContain('super-secret');
});

test('omits client_secret from the document it reads back', async () => {
  const { model, store } = setup();
  model.findByPk.mockResolvedValue(row());

  const client = await store.get('client-1');

  expect(client).not.toHaveProperty('client_secret');
});

test('accepts a confidential client presenting the matching secret', async () => {
  const { model, store } = setup();
  model.findByPk.mockResolvedValue(row());

  await expect(
    store.verifyClientSecret?.({
      clientId: 'client-1',
      clientSecret: 'secret',
    })
  ).resolves.toBe(true);
});

test('rejects a confidential client presenting the wrong secret', async () => {
  const { model, store } = setup();
  model.findByPk.mockResolvedValue(row());

  await expect(
    store.verifyClientSecret?.({
      clientId: 'client-1',
      clientSecret: 'wrong',
    })
  ).resolves.toBe(false);
});

test('rejects a confidential client presenting no secret at all', async () => {
  const { model, store } = setup();
  model.findByPk.mockResolvedValue(row());

  await expect(
    store.verifyClientSecret?.({
      clientId: 'client-1',
      clientSecret: undefined,
    })
  ).resolves.toBe(false);
});

test('accepts a public client, which has no secret to present', async () => {
  const { model, store } = setup();
  model.findByPk.mockResolvedValue(row({ clientSecretHash: null }));

  await expect(
    store.verifyClientSecret?.({
      clientId: 'client-1',
      clientSecret: undefined,
    })
  ).resolves.toBe(true);
});

test('rejects an unknown client', async () => {
  const { model, store } = setup();
  model.findByPk.mockResolvedValue(null);

  await expect(
    store.verifyClientSecret?.({ clientId: 'nope', clientSecret: 'secret' })
  ).resolves.toBe(false);
});
