import { withAdvisoryLock } from '../advisoryLock';
import { Sequelize } from '../sequelize-typescript';
import type { RunResult } from './apply';
import { applyPending, recordBaseline } from './apply';
import { DEFAULT_LEDGER_TABLE } from './ledger';
import type { MigrationStatusReport } from './plan';
import { assertUniqueNames, selectMigrations, statusReport } from './plan';
import type { Migration, MigrationArgs } from './types';

/**
 * Stable by contract: every process that runs migrations against a database
 * competes for this lock. It must differ from the key the application's own
 * `syncWithAdvisoryLock` uses — a migration reaches that sync on another
 * connection, and the same key on two connections is a deadlock.
 */
export const DEFAULT_MIGRATION_LOCK_KEY = 0x6d69_6772;

export { DEFAULT_LEDGER_TABLE };
export type { RunResult } from './apply';
export type { LedgerRow } from './ledger';
export type { MigrationStatus, MigrationStatusReport } from './plan';

export type MigrationRunnerOptions = {
  /** In the order they run. Names must be unique. */
  migrations: Migration[];
  /**
   * The application's schema sync, made available to migrations as
   * `context.sync()`. Optional: a migration that only rewrites data needs none.
   */
  sync?: () => Promise<void>;
  /**
   * The connection to run on. Omitted, the runner opens its own from the
   * `DATABASE_*` environment variables and closes it on `close()`.
   */
  sequelize?: Sequelize;
  /** @default DEFAULT_MIGRATION_LOCK_KEY */
  lockKey?: number;
  /** Bound on waiting for the lock; see `syncWithAdvisoryLock`. */
  lockTimeoutMs?: number;
  /** @default 'schema_migrations' */
  ledgerTable?: string;
  /**
   * Recorded with every applied migration — the application's version or image
   * tag — so the ledger answers which release ran it.
   */
  version?: string;
  /** Where progress goes. @default stderr */
  log?: (message: string) => void;
  /**
   * The default for `run`'s option of the same name: run against a populated
   * database whose ledger is empty, which the runner otherwise refuses. Set it
   * where the application knows its database can only ever be new — a test
   * fixture, or a deployment that creates one per run.
   * @default false
   */
  allowUnbaselined?: boolean;
};

export type RunOptions = {
  /** Only these, in declaration order. Omitted, every pending migration runs. */
  names?: string[];
  dryRun?: boolean;
  args?: MigrationArgs;
  /**
   * Run against a populated database whose ledger is empty, which the runner
   * otherwise refuses — see `applyPending`. The caller is asserting that these
   * migrations have genuinely never run against it.
   */
  allowUnbaselined?: boolean;
};

export type BaselineOptions = {
  names?: string[];
  all?: boolean;
};

const openClientFromEnvironment = (): Sequelize => {
  return new Sequelize({
    dialect: 'postgres',
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT) || 5432,
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    logging: false,
  });
};

const defaultLog = (message: string): void => {
  process.stderr.write(`${message}\n`);
};

/**
 * Runs an application's migrations against a Postgres database and records
 * each one in a ledger table, so a deploy can run `migrate run` on every
 * release and only what is pending happens.
 *
 * The ledger records what finished, not what half-ran: a migration that throws
 * leaves no row and is retried from the top on the next run, which is why
 * every migration must be idempotent as well.
 */
export const createMigrationRunner = (options: MigrationRunnerOptions) => {
  const {
    migrations,
    sync,
    lockKey = DEFAULT_MIGRATION_LOCK_KEY,
    lockTimeoutMs,
    ledgerTable: table = DEFAULT_LEDGER_TABLE,
    version,
    log = defaultLog,
    allowUnbaselined: allowUnbaselinedByDefault = false,
  } = options;

  const declared = assertUniqueNames(migrations);

  const ownsClient = !options.sequelize;

  let client: Sequelize | undefined = options.sequelize;

  const getClient = (): Sequelize => {
    client = client ?? openClientFromEnvironment();

    return client;
  };

  const shared = () => {
    return { client: getClient(), table, version, log, migrations, declared };
  };

  return {
    status: async (): Promise<MigrationStatusReport> => {
      return statusReport(shared());
    },

    run: async ({
      names,
      dryRun = false,
      args = {},
      allowUnbaselined = allowUnbaselinedByDefault,
    }: RunOptions = {}): Promise<RunResult> => {
      const selected = selectMigrations({ migrations, declared, names });

      return withAdvisoryLock({
        sequelize: getClient(),
        key: lockKey,
        lockTimeoutMs,
        fn: () => {
          return applyPending({
            ...shared(),
            sync,
            dryRun,
            args,
            selected,
            allowUnbaselined,
          });
        },
      });
    },

    baseline: async ({ names, all = false }: BaselineOptions = {}): Promise<
      string[]
    > => {
      if (!all && (!names || names.length === 0)) {
        throw new Error('baseline needs the migration names, or all: true');
      }

      const selected = selectMigrations({
        migrations,
        declared,
        names: all ? undefined : names,
      });

      return withAdvisoryLock({
        sequelize: getClient(),
        key: lockKey,
        lockTimeoutMs,
        fn: () => {
          return recordBaseline({ ...shared(), selected });
        },
      });
    },

    close: async (): Promise<void> => {
      if (ownsClient && client) {
        await client.close();
        client = undefined;
      }
    },
  };
};

export type MigrationRunner = ReturnType<typeof createMigrationRunner>;
