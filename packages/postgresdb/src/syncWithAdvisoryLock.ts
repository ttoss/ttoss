import type { Sequelize, SyncOptions } from './sequelize-typescript';

export type SyncWithAdvisoryLockOptions = {
  /**
   * The Sequelize instance whose schema will be synchronized.
   */
  sequelize: Sequelize;
  /**
   * A stable, caller-chosen 64-bit integer used as the Postgres advisory lock
   * key. It must be kept constant across releases so that every instance
   * competes for the same lock.
   */
  key: number;
  /**
   * Options forwarded to `sequelize.sync()` (e.g. `{ alter: true }`).
   * @default undefined
   */
  sync?: SyncOptions;
};

/**
 * Serializes a boot-time `sequelize.sync()` across concurrently-starting
 * application instances using a Postgres session-level advisory lock
 * (`pg_advisory_lock`).
 *
 * Any app that runs `sequelize.sync({ alter: true })` on boot behind more than
 * one instance (rolling deploys, auto-scale-out, instance refresh) faces a
 * race: the DDL runs concurrently against the same database and can deadlock,
 * error, or leave the schema inconsistent. This helper ensures only one
 * instance runs the sync at a time; the others block until the holder finishes
 * and then run against the already-migrated schema (a no-op).
 *
 * The lock is acquired and released on a single dedicated connection — a naive
 * `sequelize.query()` lock/unlock pair can land on different pooled backends
 * and try to unlock a lock the current connection never held. The lock is
 * always released on both the success and failure paths.
 *
 * @example
 * ```ts
 * await syncWithAdvisoryLock({
 *   sequelize,
 *   key: 0x50a7_5c_00, // stable, caller-chosen 64-bit key
 *   sync: { alter: true },
 * });
 * ```
 */
export const syncWithAdvisoryLock = async ({
  sequelize,
  key,
  sync,
}: SyncWithAdvisoryLockOptions): Promise<void> => {
  const connectionManager = sequelize.connectionManager;

  const connection = (await connectionManager.getConnection({
    type: 'write',
  })) as {
    query: (sql: string, values?: unknown[]) => Promise<unknown>;
  };

  try {
    await connection.query('SELECT pg_advisory_lock($1)', [key]);

    try {
      await sequelize.sync(sync);
    } finally {
      await connection.query('SELECT pg_advisory_unlock($1)', [key]);
    }
  } finally {
    connectionManager.releaseConnection(connection);
  }
};
