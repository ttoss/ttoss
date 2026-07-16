import type { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import type { Sequelize } from 'sequelize';

import { initialize, models, syncWithAdvisoryLock } from '../../models/dist';

jest.setTimeout(120000);

const LOCK_KEY = 0x50a7_5c_00;

let sequelize: Sequelize;
let postgresContainer: StartedPostgreSqlContainer;

const connect = async () => {
  const db = await initialize({
    models,
    logging: false,
    username: postgresContainer.getUsername(),
    password: postgresContainer.getPassword(),
    database: postgresContainer.getDatabase(),
    host: postgresContainer.getHost(),
    port: postgresContainer.getPort(),
    createVectorExtension: true,
    define: {
      underscored: true,
    },
  });

  return db.sequelize;
};

beforeAll(async () => {
  postgresContainer = await new PostgreSqlContainer(
    'pgvector/pgvector:0.8.1-pg18-trixie'
  ).start();

  sequelize = await connect();
});

afterAll(async () => {
  await sequelize.close();
  await postgresContainer.stop();
});

describe('syncWithAdvisoryLock', () => {
  test('should sync the schema so models are usable', async () => {
    await syncWithAdvisoryLock({
      sequelize,
      key: LOCK_KEY,
      sync: { alter: true },
    });

    const user = await models.User.create({
      email: 'advisory@domain.com',
      name: 'Advisory User',
    });

    const found = await models.User.findByPk(user.id);
    expect(found?.email).toBe('advisory@domain.com');
  });

  test('should release the advisory lock after syncing', async () => {
    await syncWithAdvisoryLock({ sequelize, key: LOCK_KEY });

    // If the lock had leaked, this try would fail to acquire it. A successful
    // acquisition proves the previous call released it.
    const [rows] = (await sequelize.query(
      'SELECT pg_try_advisory_lock($1) AS acquired',
      { bind: [LOCK_KEY] }
    )) as [Array<{ acquired: boolean }>, unknown];

    expect(rows[0].acquired).toBe(true);

    await sequelize.query('SELECT pg_advisory_unlock($1)', {
      bind: [LOCK_KEY],
    });
  });

  test('should release the lock even when sync fails', async () => {
    const error = new Error('sync failed');

    const syncSpy = jest
      .spyOn(sequelize, 'sync')
      .mockRejectedValueOnce(error as never);

    await expect(
      syncWithAdvisoryLock({ sequelize, key: LOCK_KEY })
    ).rejects.toThrow('sync failed');

    syncSpy.mockRestore();

    // The lock must have been released despite the failure.
    const [rows] = (await sequelize.query(
      'SELECT pg_try_advisory_lock($1) AS acquired',
      { bind: [LOCK_KEY] }
    )) as [Array<{ acquired: boolean }>, unknown];

    expect(rows[0].acquired).toBe(true);

    await sequelize.query('SELECT pg_advisory_unlock($1)', {
      bind: [LOCK_KEY],
    });
  });

  test('should fail fast when the lock is held longer than lockTimeoutMs', async () => {
    const holderConnection = (await sequelize.connectionManager.getConnection({
      type: 'write',
    })) as { query: (sql: string, values?: unknown[]) => Promise<unknown> };

    // A peer holds the lock and never releases it within the timeout window,
    // simulating an instance that died mid-sync while holding the lock.
    await holderConnection.query('SELECT pg_advisory_lock($1)', [LOCK_KEY]);

    const syncSpy = jest.spyOn(sequelize, 'sync');

    try {
      await expect(
        syncWithAdvisoryLock({ sequelize, key: LOCK_KEY, lockTimeoutMs: 500 })
      ).rejects.toThrow(/lock timeout/i);

      // It aborted at acquisition, so sync must never have run.
      expect(syncSpy).not.toHaveBeenCalled();
    } finally {
      syncSpy.mockRestore();
      await holderConnection.query('SELECT pg_advisory_unlock($1)', [LOCK_KEY]);
      sequelize.connectionManager.releaseConnection(holderConnection);
    }

    // The waiter released its connection cleanly, and lock_timeout did not leak:
    // a fresh bounded sync against the now-free lock succeeds.
    await syncWithAdvisoryLock({
      sequelize,
      key: LOCK_KEY,
      lockTimeoutMs: 5000,
    });
  });

  test('should serialize concurrent syncs against the same key', async () => {
    const events: string[] = [];

    const holderConnection = (await sequelize.connectionManager.getConnection({
      type: 'write',
    })) as { query: (sql: string, values?: unknown[]) => Promise<unknown> };

    // Simulate a first instance that already holds the lock.
    await holderConnection.query('SELECT pg_advisory_lock($1)', [LOCK_KEY]);
    events.push('holder-acquired');

    // A second instance tries to sync; it must block until the holder releases.
    const waiter = syncWithAdvisoryLock({ sequelize, key: LOCK_KEY }).then(
      () => {
        events.push('waiter-synced');
      }
    );

    // Give the waiter time to attempt acquisition; it should still be blocked.
    await new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
    events.push('holder-releasing');

    await holderConnection.query('SELECT pg_advisory_unlock($1)', [LOCK_KEY]);
    sequelize.connectionManager.releaseConnection(holderConnection);

    await waiter;

    expect(events).toEqual([
      'holder-acquired',
      'holder-releasing',
      'waiter-synced',
    ]);
  });
});
