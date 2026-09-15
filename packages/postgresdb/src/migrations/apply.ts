import type { Sequelize } from '../sequelize-typescript';
import { createMigrationContext } from './context';
import { hasApplicationTables, recordMigration } from './ledger';
import {
  appliedNamesOf,
  assertRequiredArgs,
  refuseUnknown,
  statusReport,
} from './plan';
import type { Migration, MigrationArgs } from './types';

export type RunResult = {
  applied: string[];
  /** Selected but already in the ledger. */
  skipped: string[];
  /**
   * Recognised as already applied by their own `isApplied` probe, and recorded
   * rather than run.
   */
  detected: string[];
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

/**
 * Asks each pending migration that can recognise its own work whether the
 * database already carries it, and records the ones that say yes.
 *
 * This is the self-healing half of adopting the ledger on a database that was
 * migrated before it existed. The probe reads through a dry-run context, so a
 * migration that writes from `isApplied` reports rather than performs.
 */
const detectApplied = async (
  params: ApplyParams & { pending: Migration[] }
): Promise<{
  detected: string[];
  remaining: Migration[];
  /**
   * Pending migrations that declare no probe, so nothing but the ledger says
   * whether they have run. These are what the guard below is about.
   */
  ambiguous: Migration[];
}> => {
  const { client, table, version, sync, log, dryRun, args, pending } = params;

  const detected: string[] = [];
  const remaining: Migration[] = [];
  const ambiguous: Migration[] = [];

  for (const migration of pending) {
    if (!migration.isApplied) {
      remaining.push(migration);
      ambiguous.push(migration);

      continue;
    }

    const already = await migration.isApplied(
      createMigrationContext({
        client,
        // Never lets a probe write, whatever the run is doing.
        dryRun: true,
        args,
        say: (message) => {
          log(`${migration.name}: ${message}`);
        },
        sync,
      })
    );

    if (!already) {
      remaining.push(migration);

      continue;
    }

    if (!dryRun) {
      await recordMigration({
        client,
        table,
        name: migration.name,
        durationMs: 0,
        version,
        args: null,
        baseline: true,
      });
    }

    detected.push(migration.name);
    log(
      `${migration.name}: already applied to this database, recorded without running`
    );
  }

  return { detected, remaining, ambiguous };
};

/**
 * An empty ledger beside a populated schema is ambiguous: either the database
 * is new, or it was migrated before the ledger existed. Guessing "new" re-runs
 * history, so the runner stops and makes the operator say which it is.
 */
const refuseUnbaselined = (params: {
  ambiguous: Migration[];
  log: (message: string) => void;
}): never => {
  const { ambiguous, log } = params;

  for (const migration of ambiguous) {
    log(`${migration.name}: pending, and cannot recognise its own work`);
  }

  throw new Error(
    'This database already holds tables but its migration ledger is empty, so the runner cannot tell a new database from one migrated before the ledger existed. If these migrations already ran against it, record them with `baseline` (or `baseline --all`). If they genuinely never ran, re-run with --allow-unbaselined.'
  );
};

export const applyPending = async (
  params: ApplyParams & {
    selected: Migration[];
    migrations: Migration[];
    declared: Set<string>;
    allowUnbaselined: boolean;
  }
): Promise<RunResult> => {
  const { client, table, selected, migrations, declared, log } = params;

  const report = await statusReport({ client, table, migrations, declared });

  refuseUnknown(report.unknown);

  const applied = appliedNamesOf(report);

  // Nothing recorded at all, which is what makes the guard below necessary.
  const ledgerEmpty = applied.size === 0;

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

  const { detected, remaining, ambiguous } = await detectApplied({
    ...params,
    pending,
  });

  // A probe that answered — either way — has already resolved the ambiguity
  // from the schema, so only migrations that declare none can trip this.
  if (
    ledgerEmpty &&
    ambiguous.length > 0 &&
    !params.allowUnbaselined &&
    (await hasApplicationTables({ client, table }))
  ) {
    refuseUnbaselined({ ambiguous, log });
  }

  assertRequiredArgs({ pending: remaining, args: params.args });

  if (remaining.length === 0) {
    log(detected.length > 0 ? 'nothing left to migrate' : 'nothing to migrate');

    return { applied: [], skipped, detected };
  }

  for (const migration of remaining) {
    await applyOne({ ...params, migration });
  }

  return {
    applied: remaining.map((migration) => {
      return migration.name;
    }),
    skipped,
    detected,
  };
};

export const recordBaseline = async (params: {
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
