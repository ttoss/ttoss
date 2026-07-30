import type { OAuthClient as OAuthClientRecord } from '@ttoss/auth-core';
import { createRefreshRotation } from '@ttoss/auth-core';
import type { OAuthRefreshToken } from 'src/models/OAuthRefreshToken';
import { createRefreshTokenStore } from 'src/stores/createRefreshTokenStore';

type Row = {
  tokenHash: string;
  clientId: string;
  subject: string;
  scopes: string[];
  expiresAt: Date;
  consumedAt: Date | null;
};

/**
 * A model double backed by a `Map`, reproducing what Postgres gives back: a
 * nullable timestamp column reads as `null`, never `undefined`.
 */
const createFakeModel = () => {
  const rows = new Map<string, Row>();

  return {
    rows,
    findByPk: jest.fn(async (tokenHash: string) => {
      return rows.get(tokenHash) ?? null;
    }),
    upsert: jest.fn(async (values: Row) => {
      rows.set(values.tokenHash, { ...values });
    }),
    destroy: jest.fn(
      async ({
        where,
      }: {
        where: { tokenHash?: string; clientId?: string; subject?: string };
      }) => {
        for (const [tokenHash, row] of rows) {
          const matches =
            where.tokenHash !== undefined
              ? tokenHash === where.tokenHash
              : row.clientId === where.clientId &&
                row.subject === where.subject;

          if (matches) {
            rows.delete(tokenHash);
          }
        }
      }
    ),
  };
};

const setup = () => {
  const model = createFakeModel();
  const store = createRefreshTokenStore({
    model: model as unknown as typeof OAuthRefreshToken,
  });
  return { model, store };
};

const EXPIRES_AT = 1_700_000_000_000;

test('writes a live token with a null consumedAt column', async () => {
  const { model, store } = setup();

  await store.save({
    tokenHash: 'hash-1',
    clientId: 'client-1',
    subject: 'user-1',
    scopes: ['mcp:access'],
    expiresAt: EXPIRES_AT,
  });

  expect(model.rows.get('hash-1')).toEqual({
    tokenHash: 'hash-1',
    clientId: 'client-1',
    subject: 'user-1',
    scopes: ['mcp:access'],
    expiresAt: new Date(EXPIRES_AT),
    consumedAt: null,
  });
});

test('omits consumedAt for a live token rather than reporting null', async () => {
  const { store } = setup();

  await store.save({
    tokenHash: 'hash-1',
    clientId: 'client-1',
    subject: 'user-1',
    scopes: ['mcp:access'],
    expiresAt: EXPIRES_AT,
  });

  const stored = await store.get('hash-1');

  expect(stored).not.toHaveProperty('consumedAt');
  expect(stored?.consumedAt).toBeUndefined();
});

test('round-trips a consumed token as epoch milliseconds', async () => {
  const { store } = setup();

  await store.save({
    tokenHash: 'hash-1',
    clientId: 'client-1',
    subject: 'user-1',
    scopes: ['mcp:access'],
    expiresAt: EXPIRES_AT,
    consumedAt: EXPIRES_AT - 1000,
  });

  await expect(store.get('hash-1')).resolves.toEqual({
    tokenHash: 'hash-1',
    clientId: 'client-1',
    subject: 'user-1',
    scopes: ['mcp:access'],
    expiresAt: EXPIRES_AT,
    consumedAt: EXPIRES_AT - 1000,
  });
});

test('resolves undefined for an unknown token', async () => {
  const { store } = setup();

  await expect(store.get('nope')).resolves.toBeUndefined();
});

test('deletes one token by hash', async () => {
  const { model, store } = setup();
  await store.save({
    tokenHash: 'hash-1',
    clientId: 'client-1',
    subject: 'user-1',
    scopes: [],
    expiresAt: EXPIRES_AT,
  });

  await store.delete('hash-1');

  expect(model.rows.size).toBe(0);
});

test('revokes every token of one owner, leaving other owners alone', async () => {
  const { model, store } = setup();
  await store.save({
    tokenHash: 'hash-1',
    clientId: 'client-1',
    subject: 'user-1',
    scopes: [],
    expiresAt: EXPIRES_AT,
  });
  await store.save({
    tokenHash: 'hash-2',
    clientId: 'client-1',
    subject: 'user-1',
    scopes: [],
    expiresAt: EXPIRES_AT,
  });
  await store.save({
    tokenHash: 'hash-3',
    clientId: 'client-1',
    subject: 'user-2',
    scopes: [],
    expiresAt: EXPIRES_AT,
  });

  await store.deleteByOwner({ clientId: 'client-1', subject: 'user-1' });

  expect([...model.rows.keys()]).toEqual(['hash-3']);
});

describe('with createRefreshRotation', () => {
  const client: OAuthClientRecord = {
    client_id: 'client-1',
    redirect_uris: ['https://claude.ai/callback'],
  };

  test('rotates on the first refresh instead of treating it as replay', async () => {
    const { store } = setup();
    const refresh = createRefreshRotation({ store });

    const token = await refresh.issue({
      client,
      subject: 'user-1',
      scopes: ['mcp:access'],
    });

    await expect(
      refresh.onRefreshToken({ refreshToken: token, client, scopes: [] })
    ).resolves.toEqual({ subject: 'user-1', scopes: ['mcp:access'] });
  });

  test('detects reuse of an already-rotated token', async () => {
    const { model, store } = setup();
    const refresh = createRefreshRotation({ store });

    const first = await refresh.issue({
      client,
      subject: 'user-1',
      scopes: ['mcp:access'],
    });
    await refresh.onRefreshToken({
      refreshToken: first,
      client,
      scopes: [],
    });

    await expect(
      refresh.onRefreshToken({ refreshToken: first, client, scopes: [] })
    ).resolves.toBeUndefined();
    expect(model.rows.size).toBe(0);
  });
});
