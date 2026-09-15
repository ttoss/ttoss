import type { Sequelize } from './sequelize-typescript';

export type WithAdvisoryLockOptions<T> = {
  sequelize: Sequelize;
  /**
   * A stable, caller-chosen 64-bit integer used as the Postgres advisory lock
   * key. Every process that must be serialized has to use the same one.
   */
  key: number;
  /**
   * Upper bound in milliseconds on how long to wait to acquire the lock,
   * enforced via Postgres `lock_timeout`. Omitted, the wait is unbounded.
   */
  lockTimeoutMs?: number;
  /**
   * What runs while the lock is held.
   */
  fn: () => Promise<T>;
};

/**
 * Runs `fn` while holding a Postgres session-level advisory lock
 * (`pg_advisory_lock`), acquired and released on a single dedicated connection.
 *
 * A naive `sequelize.query()` lock/unlock pair can land on different pooled
 * backends and try to unlock a lock the current connection never held, so the
 * connection is borrowed once and kept for the whole critical section. The
 * lock is always released on both the success and failure paths.
 */
export const withAdvisoryLock = async <T>({
  sequelize,
  key,
  lockTimeoutMs,
  fn,
}: WithAdvisoryLockOptions<T>): Promise<T> => {
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
      return await fn();
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
