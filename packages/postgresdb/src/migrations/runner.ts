import { withAdvisoryLock } from '../advisoryLock';
import { Sequelize } from '../sequelize-typescript';
import { createMigrationContext } from './context';
import type { LedgerRow } from './ledger';
import { DEFAULT_LEDGER_TABLE, readLedger, recordMigration } from './ledger';
import type { Migration, MigrationArgs } from './types';

/**
 * Stable by contract: every process that runs migrations against a database
 * competes for this lock. It must differ from the key the application's own
 * `syncWithAdvisoryLock` uses — a migration reaches that sync on another
 * connection, and the same key on two connections is a deadlock.
 */
export const DEFAULT_MIGRATION_LOCK_KEY = 0x6d69_6772;

export { DEFAULT_LEDGER_TABLE };
export type { LedgerRow };

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
};

export type MigrationStatus = {
  name: string;
  description?: string;
  /** `null` while pending. */
  applied: LedgerRow | null;
};

export type MigrationStatusReport = {
  migrations: MigrationStatus[];
  /**
   * Ledger rows no declared migration carries. A renamed or deleted migration
   * lands here, and both `run` and `baseline` refuse to start while it is
   * non-empty.
   */
  unknown: LedgerRow[];
};

export type RunOptions = {
  /** Only these, in declaration order. Omitted, every pending migration runs. */
  names?: string[];
  dryRun?: boolean;
  args?: MigrationArgs;
};

export type RunResult = {
  applied: string[];
  /** Selected but already in the ledger. */
  skipped: string[];
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
 * Only the flags a migration declares reach its ledger row: the row answers
 * what this migration was told, and a flag meant for another migration — or a
 * secret that happened to be on the same command line — is not part of that
 * answer.
 */
const declaredArgs = (params: {
  migration: Migration;
  args: MigrationArgs;
}): MigrationArgs | null => {
  const { migration, args } = params;

  const entries = (migration.options ?? [])
    .filter((option) => {
      return args[option.flag] !== undefined;
    })
    .map((option) => {
      return [option.flag, args[option.flag]] as const;
    });

  return entries.length > 0 ? Object.fromEntries(entries) : null;
};

const assertUniqueNames = (migrations: Migration[]): Set<string> => {
  const seen = new Set<string>();

  for (const { name } of migrations) {
    if (seen.has(name)) {
      throw new Error(`Duplicate migration name: "${name}"`);
    }

    seen.add(name);
  }

  return seen;
};

const selectMigrations = (params: {
  migrations: Migration[];
  declared: Set<string>;
  names?: string[];
}): Migration[] => {
  const { migrations, declared, names } = params;

  if (!names || names.length === 0) {
    return migrations;
  }

  const unknown = names.filter((name) => {
    return !declared.has(name);
  });

  if (unknown.length > 0) {
    throw new Error(
      `Unknown migration${unknown.length > 1 ? 's' : ''}: ${unknown
        .map((name) => {
          return `"${name}"`;
        })
        .join(', ')}`
    );
  }

  return migrations.filter((migration) => {
    return names.includes(migration.name);
  });
};

const refuseUnknown = (unknown: LedgerRow[]): void => {
  if (unknown.length === 0) {
    return;
  }

  const names = unknown
    .map((row) => {
      return `"${row.name}"`;
    })
    .join(', ');

  throw new Error(
    `The ledger holds ${unknown.length} migration${unknown.length > 1 ? 's' : ''} nothing declares: ${names}. A migration is never renamed or deleted after it has run; restore it, or remove the row deliberately.`
  );
};

/**
 * Checked before the first migration starts, so a run that cannot finish fails
 * having changed nothing rather than half way through.
 */
const assertRequiredArgs = (params: {
  pending: Migration[];
  args: MigrationArgs;
}): void => {
  const { pending, args } = params;

  const missing = pending.flatMap((migration) => {
    return (migration.options ?? [])
      .filter((option) => {
        return option.required && typeof args[option.flag] !== 'string';
      })
      .map((option) => {
        return `--${option.flag} (${migration.name})`;
      });
  });

  if (missing.length > 0) {
    throw new Error(`Missing required option(s): ${missing.join(', ')}`);
  }
};

const statusReport = async (params: {
  client: Sequelize;
  table: string;
  migrations: Migration[];
  declared: Set<string>;
}): Promise<MigrationStatusReport> => {
  const { client, table, migrations, declared } = params;

  const applied = await readLedger({ client, table });

  return {
    migrations: migrations.map(({ name, description }) => {
      return { name, description, applied: applied.get(name) ?? null };
    }),
    unknown: [...applied.values()].filter((row) => {
      return !declared.has(row.name);
    }),
  };
};

const appliedNamesOf = (report: MigrationStatusReport): Set<string> => {
  return new Set(
    report.migrations
      .filter((entry) => {
        return entry.applied !== null;
      })
      .map((entry) => {
        return entry.name;
      })
  );
};

type ApplyParams = {
  client: Sequelize;
  table: string;
  version?: string;
  sync?: () => Promise<void>;
  log: (message: string) => void;
  dryRun: boolean;
  args: MigrationArgs;
};

const applyOne = async (
  params: ApplyParams & { migration: Migration }
): Promise<void> => {
  const { client, table, version, sync, log, dryRun, args, migration } = params;

  const prefix = `${dryRun ? 'dry-run ' : ''}${migration.name}`;

  log(`${prefix}: starting`);

  const startedAt = Date.now();

  await migration.up(
    createMigrationContext({
      client,
      dryRun,
      args,
      say: (message) => {
        log(`${prefix}: ${message}`);
      },
      sync,
    })
  );

  const durationMs = Date.now() - startedAt;

  if (!dryRun) {
    // Recorded only once `up` has resolved: a row means "finished", and a
    // failure above leaves none, so the next run retries it from the top.
    await recordMigration({
      client,
      table,
      name: migration.name,
      durationMs,
      version,
      args: declaredArgs({ migration, args }),
      baseline: false,
    });
  }

  log(`${prefix}: ${dryRun ? 'would apply' : 'applied'} (${durationMs}ms)`);
};

const applyPending = async (
  params: ApplyParams & {
    selected: Migration[];
    migrations: Migration[];
    declared: Set<string>;
  }
): Promise<RunResult> => {
  const { client, table, selected, migrations, declared, log } = params;

  const report = await statusReport({ client, table, migrations, declared });

  refuseUnknown(report.unknown);

  const applied = appliedNamesOf(report);

  const pending = selected.filter((migration) => {
    return !applied.has(migration.name);
  });

  const skipped = selected
    .filter((migration) => {
      return applied.has(migration.name);
    })
    .map((migration) => {
      return migration.name;
    });

  assertRequiredArgs({ pending, args: params.args });

  if (pending.length === 0) {
    log('nothing to migrate');

    return { applied: [], skipped };
  }

  for (const migration of pending) {
    await applyOne({ ...params, migration });
  }

  return {
    applied: pending.map((migration) => {
      return migration.name;
    }),
    skipped,
  };
};

const recordBaseline = async (params: {
  client: Sequelize;
  table: string;
  version?: string;
  log: (message: string) => void;
  selected: Migration[];
  migrations: Migration[];
  declared: Set<string>;
}): Promise<string[]> => {
  const { client, table, version, log, selected, migrations, declared } =
    params;

  const report = await statusReport({ client, table, migrations, declared });

  refuseUnknown(report.unknown);

  const already = appliedNamesOf(report);
  const recorded: string[] = [];

  for (const migration of selected) {
    if (already.has(migration.name)) {
      log(`${migration.name}: already in the ledger`);

      continue;
    }

    await recordMigration({
      client,
      table,
      name: migration.name,
      durationMs: 0,
      version,
      args: null,
      baseline: true,
    });

    recorded.push(migration.name);
    log(`${migration.name}: recorded as baseline, nothing ran`);
  }

  return recorded;
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
    }: RunOptions = {}): Promise<RunResult> => {
      const selected = selectMigrations({ migrations, declared, names });

      return withAdvisoryLock({
        sequelize: getClient(),
        key: lockKey,
        lockTimeoutMs,
        fn: () => {
          return applyPending({ ...shared(), sync, dryRun, args, selected });
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
