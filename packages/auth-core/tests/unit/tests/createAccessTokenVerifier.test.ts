import {
  type AccessTokenStore,
  createAccessTokenVerifier,
  createMemoryAccessTokenStore,
  generateApiToken,
} from '../../../src/index';

const seed = (
  store: AccessTokenStore,
  overrides: Partial<{
    tokenHash: string;
    subject: string;
    scopes: string[];
    clientId: string;
    expiresAt: number | null;
  }> = {}
) => {
  return store.save({
    tokenHash: overrides.tokenHash ?? 'hash',
    subject: overrides.subject ?? 'user-1',
    scopes: overrides.scopes ?? ['read'],
    clientId: overrides.clientId ?? 'client-abc',
    expiresAt: overrides.expiresAt ?? Date.now() + 60_000,
  });
};

describe('createAccessTokenVerifier', () => {
  test('verifies a token end-to-end against generateApiToken hashing', async () => {
    const store = createMemoryAccessTokenStore();
    const { token, tokenHash } = generateApiToken({ prefix: 'myapp' });
    await seed(store, { tokenHash, scopes: ['read', 'write'] });

    const verify = createAccessTokenVerifier({ store });
    // The default hasher matches generateApiToken — no wiring needed.
    await expect(verify(token)).resolves.toEqual({
      subject: 'user-1',
      scopes: ['read', 'write'],
      clientId: 'client-abc',
    });
  });

  test('returns null for an unknown token without leaking existence', async () => {
    const store = createMemoryAccessTokenStore();
    const verify = createAccessTokenVerifier({ store });
    await expect(verify('never-issued')).resolves.toBeNull();
  });

  test('rejects an expired token', async () => {
    const store = createMemoryAccessTokenStore();
    await seed(store, { tokenHash: 'h', expiresAt: Date.now() - 1 });
    const verify = createAccessTokenVerifier({
      store,
      hashToken: (t) => {
        return t;
      },
    });
    await expect(verify('h')).resolves.toBeNull();
  });

  test('expiresAt: null never expires', async () => {
    const store = createMemoryAccessTokenStore();
    await seed(store, { tokenHash: 'h', expiresAt: null });
    const verify = createAccessTokenVerifier({
      store,
      hashToken: (t) => {
        return t;
      },
    });
    await expect(verify('h')).resolves.toMatchObject({ subject: 'user-1' });
  });

  test('hashes the token before lookup — plaintext never reaches the store', async () => {
    const get = jest.fn().mockResolvedValue(undefined);
    const store = {
      get,
    } as unknown as AccessTokenStore;
    const verify = createAccessTokenVerifier({ store });
    await verify('plaintext-secret');
    expect(get).toHaveBeenCalledTimes(1);
    const lookupKey = get.mock.calls[0][0] as string;
    expect(lookupKey).not.toBe('plaintext-secret');
    expect(lookupKey).toMatch(/^[a-f0-9]{64}$/);
  });

  test('revocation is immediate — a deleted token fails the next call', async () => {
    const store = createMemoryAccessTokenStore();
    await seed(store, { tokenHash: 'h' });
    const verify = createAccessTokenVerifier({
      store,
      hashToken: (t) => {
        return t;
      },
    });

    await expect(verify('h')).resolves.toBeTruthy();
    await store.delete('h');
    await expect(verify('h')).resolves.toBeNull();
  });

  test('records lastUsedAt only when touchLastUsed is enabled', async () => {
    const store = createMemoryAccessTokenStore();
    await seed(store, { tokenHash: 'h' });

    await createAccessTokenVerifier({
      store,
      hashToken: (t) => {
        return t;
      },
    })('h');
    expect((await store.get('h'))?.lastUsedAt).toBeUndefined();

    await createAccessTokenVerifier({
      store,
      hashToken: (t) => {
        return t;
      },
      touchLastUsed: true,
    })('h');
    expect((await store.get('h'))?.lastUsedAt).toEqual(expect.any(Number));
  });

  test('a failing touchLastUsed never blocks or rejects verification', async () => {
    const base = createMemoryAccessTokenStore();
    await seed(base, { tokenHash: 'h' });
    const store: AccessTokenStore = {
      ...base,
      touchLastUsed: jest.fn().mockRejectedValue(new Error('write failed')),
    };
    const verify = createAccessTokenVerifier({
      store,
      hashToken: (t) => {
        return t;
      },
      touchLastUsed: true,
    });
    await expect(verify('h')).resolves.toMatchObject({ subject: 'user-1' });
  });
});
