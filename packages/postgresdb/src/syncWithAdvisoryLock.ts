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
  /**
   * Upper bound in milliseconds on how long to wait to *acquire* the advisory
   * lock, enforced via Postgres `lock_timeout`. When omitted the wait is
   * unbounded (the historical behavior).
   *
   * Why bound it: a session-level advisory lock held by an instance that died
   * mid-sync (SIGKILL, OOM) stays held until its backend is reaped — behind a
   * connection pooler or Aurora that can take minutes. Without a bound, every
   * later boot blocks on `pg_advisory_lock` forever and the whole deploy
   * deadlocks. With it, acquisition fails fast with `canceling statement due to
   * lock timeout`, which the caller can surface (e.g. exit the process) instead
   * of hanging silently.
   *
   * It must be **larger than a legitimate `sync` duration**, so an instance that
   * is merely waiting for a live peer's migration waits it out rather than
   * aborting. Must be a positive integer; other values are ignored.
   * @default undefined
   */
  lockTimeoutMs?: number;
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
  lockTimeoutMs,
}: SyncWithAdvisoryLockOptions): Promise<void> => {
  const connectionManager = sequelize.connectionManager;

  const connection = (await connectionManager.getConnection({
    type: 'write',
  })) as {
    query: (sql: string, values?: unknown[]) => Promise<unknown>;
  };

  const bounded =
    typeof lockTimeoutMs === 'number' &&
    Number.isInteger(lockTimeoutMs) &&
    lockTimeoutMs > 0;

  try {
    if (bounded) {
      // `lockTimeoutMs` is validated as a positive integer here, so inlining it
      // is safe — SET does not accept bind parameters. If the lock is held
      // beyond this, pg_advisory_lock below rejects with
      // "canceling statement due to lock timeout".
      await connection.query(`SET lock_timeout = ${lockTimeoutMs}`);
    }

    await connection.query('SELECT pg_advisory_lock($1)', [key]);

    try {
      await sequelize.sync(sync);
    } finally {
      await connection.query('SELECT pg_advisory_unlock($1)', [key]);
    }
  } finally {
    if (bounded) {
      // Restore the default so the timeout does not leak onto later borrowers
      // of this pooled connection. Best-effort: the connection may already be
      // in an error state.
      await connection.query('SET lock_timeout = 0').catch(() => {
        return undefined;
      });
    }
    connectionManager.releaseConnection(connection);
  }
};
