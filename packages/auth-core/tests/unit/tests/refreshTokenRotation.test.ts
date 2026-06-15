import {
  createMemoryRefreshTokenStore,
  createRefreshRotation,
  type OAuthClient,
  type RefreshTokenStore,
} from '../../../src/index';

const client: OAuthClient = {
  client_id: 'client-abc',
  redirect_uris: ['https://app.example.com/callback'],
};

const otherClient: OAuthClient = {
  client_id: 'client-xyz',
  redirect_uris: ['https://other.example.com/callback'],
};

const setup = (overrides: { store?: RefreshTokenStore } = {}) => {
  const store = overrides.store ?? createMemoryRefreshTokenStore();
  const rotation = createRefreshRotation({ store });
  return { store, rotation };
};

describe('createRefreshRotation — issue', () => {
  test('mints a unique opaque token per call', async () => {
    const { rotation } = setup();
    const a = await rotation.issue({ client, subject: 'user-1', scopes: [] });
    const b = await rotation.issue({ client, subject: 'user-1', scopes: [] });
    expect(a).toBeTruthy();
    expect(a).not.toBe(b);
  });

  test('does not persist the plaintext token (only its hash)', async () => {
    const saved: string[] = [];
    const store = createMemoryRefreshTokenStore();
    const wrapped: RefreshTokenStore = {
      ...store,
      save: (token) => {
        saved.push(token.tokenHash);
        return store.save(token);
      },
    };
    const rotation = createRefreshRotation({ store: wrapped });
    const token = await rotation.issue({
      client,
      subject: 'user-1',
      scopes: ['read'],
    });
    expect(saved).toHaveLength(1);
    expect(saved[0]).not.toBe(token);
    expect(saved[0]).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe('createRefreshRotation — onRefreshToken', () => {
  test('approves a valid token with its granted scopes', async () => {
    const { rotation } = setup();
    const token = await rotation.issue({
      client,
      subject: 'user-1',
      scopes: ['read', 'write'],
    });
    const result = await rotation.onRefreshToken({
      refreshToken: token,
      client,
      scopes: [],
    });
    expect(result).toEqual({ subject: 'user-1', scopes: ['read', 'write'] });
  });

  test('rejects an unknown token', async () => {
    const { rotation } = setup();
    const result = await rotation.onRefreshToken({
      refreshToken: 'never-issued',
      client,
      scopes: [],
    });
    expect(result).toBeUndefined();
  });

  test('enforces single use — a token cannot be exchanged twice', async () => {
    const { rotation } = setup();
    const token = await rotation.issue({
      client,
      subject: 'user-1',
      scopes: ['read'],
    });
    expect(
      await rotation.onRefreshToken({ refreshToken: token, client, scopes: [] })
    ).toBeTruthy();
    expect(
      await rotation.onRefreshToken({ refreshToken: token, client, scopes: [] })
    ).toBeUndefined();
  });

  test('reuse of a consumed token revokes the owner entire token set', async () => {
    const { rotation } = setup();
    const stolen = await rotation.issue({
      client,
      subject: 'user-1',
      scopes: ['read'],
    });
    // A second live token for the same owner (e.g. issued by rotation).
    const live = await rotation.issue({
      client,
      subject: 'user-1',
      scopes: ['read'],
    });

    // Legitimately consume the first token once.
    await rotation.onRefreshToken({ refreshToken: stolen, client, scopes: [] });
    // Replay the consumed token: reuse detected.
    expect(
      await rotation.onRefreshToken({
        refreshToken: stolen,
        client,
        scopes: [],
      })
    ).toBeUndefined();

    // The whole owner chain is revoked, including the still-live token.
    expect(
      await rotation.onRefreshToken({ refreshToken: live, client, scopes: [] })
    ).toBeUndefined();
  });

  test('reuse revocation is scoped to the owner, leaving other owners intact', async () => {
    const { rotation } = setup();
    const reused = await rotation.issue({
      client,
      subject: 'user-1',
      scopes: ['read'],
    });
    const otherOwner = await rotation.issue({
      client,
      subject: 'user-2',
      scopes: ['read'],
    });

    await rotation.onRefreshToken({ refreshToken: reused, client, scopes: [] });
    await rotation.onRefreshToken({ refreshToken: reused, client, scopes: [] });

    expect(
      await rotation.onRefreshToken({
        refreshToken: otherOwner,
        client,
        scopes: [],
      })
    ).toEqual({ subject: 'user-2', scopes: ['read'] });
  });

  test('rejects and sweeps an expired token', async () => {
    const store = createMemoryRefreshTokenStore();
    const rotation = createRefreshRotation({
      store,
      refreshTokenTtl: -1,
      hashToken: (token) => {
        return `hash:${token}`;
      },
    });
    const token = await rotation.issue({
      client,
      subject: 'user-1',
      scopes: ['read'],
    });
    expect(
      await rotation.onRefreshToken({ refreshToken: token, client, scopes: [] })
    ).toBeUndefined();
    // Swept on access — no stale record lingers for a later reuse check.
    expect(await store.get(`hash:${token}`)).toBeUndefined();
  });

  test('rejects a token presented by a different client', async () => {
    const { rotation } = setup();
    const token = await rotation.issue({
      client,
      subject: 'user-1',
      scopes: ['read'],
    });
    expect(
      await rotation.onRefreshToken({
        refreshToken: token,
        client: otherClient,
        scopes: [],
      })
    ).toBeUndefined();
  });

  test('narrows scopes when the refresh requests a subset', async () => {
    const { rotation } = setup();
    const token = await rotation.issue({
      client,
      subject: 'user-1',
      scopes: ['read', 'write'],
    });
    expect(
      await rotation.onRefreshToken({
        refreshToken: token,
        client,
        scopes: ['read'],
      })
    ).toEqual({ subject: 'user-1', scopes: ['read'] });
  });

  test('rejects a refresh requesting scopes beyond those granted', async () => {
    const { rotation } = setup();
    const token = await rotation.issue({
      client,
      subject: 'user-1',
      scopes: ['read'],
    });
    expect(
      await rotation.onRefreshToken({
        refreshToken: token,
        client,
        scopes: ['read', 'admin'],
      })
    ).toBeUndefined();
  });

  test('honours a custom token generator and hasher', async () => {
    let counter = 0;
    const store = createMemoryRefreshTokenStore();
    const rotation = createRefreshRotation({
      store,
      generateToken: () => {
        counter += 1;
        return `token-${counter}`;
      },
      hashToken: (token) => {
        return `hash:${token}`;
      },
    });
    const token = await rotation.issue({
      client,
      subject: 'user-1',
      scopes: [],
    });
    expect(token).toBe('token-1');
    expect(await store.get(`hash:${token}`)).toBeTruthy();
  });
});
