import type { OAuthPendingAuthorization } from 'src/models/OAuthPendingAuthorization';
import { createPendingAuthorizationStore } from 'src/stores/createPendingAuthorizationStore';

const setup = () => {
  const model = {
    create: jest.fn(),
    findByPk: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  };
  const store = createPendingAuthorizationStore({
    model: model as unknown as typeof OAuthPendingAuthorization,
  });
  return { model, store };
};

const EXPIRES_AT = 1_700_000_600_000;

const pending = {
  id: 'pending-1',
  clientId: 'client-1',
  redirectUri: 'https://client.example/callback',
  scopes: ['read', 'write'],
  codeChallenge: 'challenge',
  codeChallengeMethod: 'S256',
  expiresAt: EXPIRES_AT,
};

const row = (overrides: Record<string, unknown> = {}) => {
  return {
    ...pending,
    state: null,
    resource: null,
    expiresAt: new Date(EXPIRES_AT),
    approvedSubject: null,
    approvedScopes: null,
    resumeSecretHash: null,
    ...overrides,
  };
};

test('save inserts an unapproved request, with nulls for absent fields', async () => {
  const { model, store } = setup();

  await store.save(pending);

  expect(model.create).toHaveBeenCalledWith({
    ...pending,
    state: null,
    resource: null,
    expiresAt: new Date(EXPIRES_AT),
  });
});

test('save keeps state and resource when present', async () => {
  const { model, store } = setup();

  await store.save({ ...pending, state: 's', resource: 'https://api' });

  expect(model.create).toHaveBeenCalledWith(
    expect.objectContaining({ state: 's', resource: 'https://api' })
  );
});

test('get maps an unapproved row back with epoch-millisecond expiry', async () => {
  const { model, store } = setup();
  model.findByPk.mockResolvedValue(row());

  await expect(store.get('pending-1')).resolves.toEqual({
    ...pending,
    state: undefined,
    resource: undefined,
    approval: undefined,
  });
});

test('get maps an approval', async () => {
  const { model, store } = setup();
  model.findByPk.mockResolvedValue(
    row({
      state: 's',
      resource: 'https://api',
      approvedSubject: 'user-1',
      approvedScopes: ['read'],
      resumeSecretHash: 'hash',
    })
  );

  await expect(store.get('pending-1')).resolves.toMatchObject({
    state: 's',
    resource: 'https://api',
    approval: { subject: 'user-1', scopes: ['read'], resumeSecretHash: 'hash' },
  });
});

test('get fills a partially recorded approval with empty values', async () => {
  const { model, store } = setup();
  model.findByPk.mockResolvedValue(row({ approvedSubject: 'user-1' }));

  await expect(store.get('pending-1')).resolves.toMatchObject({
    approval: { subject: 'user-1', scopes: [], resumeSecretHash: '' },
  });
});

test('get resolves undefined for an unknown id', async () => {
  const { model, store } = setup();
  model.findByPk.mockResolvedValue(null);

  await expect(store.get('nope')).resolves.toBeUndefined();
});

test('approve updates only an unapproved row, in one statement', async () => {
  const { model, store } = setup();
  model.update.mockResolvedValue([1]);
  const approval = {
    subject: 'user-1',
    scopes: ['read'],
    resumeSecretHash: 'hash',
  };

  await expect(store.approve({ id: 'pending-1', approval })).resolves.toBe(
    true
  );
  expect(model.update).toHaveBeenCalledWith(
    {
      approvedSubject: 'user-1',
      approvedScopes: ['read'],
      resumeSecretHash: 'hash',
    },
    { where: { id: 'pending-1', approvedSubject: null } }
  );
});

test('approve reports false when the row was gone or already approved', async () => {
  const { model, store } = setup();
  model.update.mockResolvedValue([0]);

  await expect(
    store.approve({
      id: 'pending-1',
      approval: { subject: 'u', scopes: [], resumeSecretHash: 'h' },
    })
  ).resolves.toBe(false);
});

test('consume returns the row only to the caller whose delete removed it', async () => {
  const { model, store } = setup();
  model.findByPk.mockResolvedValue(row({ approvedSubject: 'user-1' }));
  model.destroy.mockResolvedValueOnce(1).mockResolvedValueOnce(0);

  await expect(store.consume('pending-1')).resolves.toMatchObject({
    id: 'pending-1',
  });
  await expect(store.consume('pending-1')).resolves.toBeUndefined();
  expect(model.destroy).toHaveBeenCalledWith({ where: { id: 'pending-1' } });
});

test('consume resolves undefined for an unknown id', async () => {
  const { model, store } = setup();
  model.findByPk.mockResolvedValue(null);

  await expect(store.consume('nope')).resolves.toBeUndefined();
  expect(model.destroy).not.toHaveBeenCalled();
});

test('delete removes only an unapproved row', async () => {
  const { model, store } = setup();

  await store.delete('pending-1');

  expect(model.destroy).toHaveBeenCalledWith({
    where: { id: 'pending-1', approvedSubject: null },
  });
});
