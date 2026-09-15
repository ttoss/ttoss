import { QueryTypes } from 'sequelize';

import type { Sequelize } from '../sequelize-typescript';
import type { MigrationArgs, MigrationContext, SqlArgs } from './types';

/** Double-quotes a SQL identifier, escaping any quote it carries. */
export const quoteIdentifier = (identifier: string): string => {
  return `"${identifier.replace(/"/g, '""')}"`;
};

export const select = async <T>(args: {
  client: Sequelize;
  sql: string;
  values?: unknown[];
}): Promise<T[]> => {
  const { client, sql, values } = args;

  return client.query<T>(sql, {
    type: QueryTypes.SELECT,
    bind: values,
  }) as Promise<T[]>;
};

type Selector = <T>(args: SqlArgs) => Promise<T[]>;
type Runner = (args: SqlArgs) => Promise<void>;

const createSelector = (client: Sequelize): Selector => {
  return <T>(args: SqlArgs) => {
    return select<T>({ client, ...args });
  };
};

const createRunner = (args: {
  client: Sequelize;
  dryRun: boolean;
  say: (message: string) => void;
}): Runner => {
  const { client, dryRun, say } = args;

  return async ({ sql, values }) => {
    if (dryRun) {
      say(`would run ${sql.replace(/\s+/g, ' ').trim()}`);

      return;
    }

    await client.query(sql, { bind: values });
  };
};

const createSync = (args: {
  dryRun: boolean;
  say: (message: string) => void;
  sync?: () => Promise<void>;
}): (() => Promise<void>) => {
  const { dryRun, say, sync } = args;

  return async () => {
    if (!sync) {
      throw new Error(
        'This migration calls sync(), but the runner was created without one. Pass `sync` to createMigrationRunner.'
      );
    }

    if (dryRun) {
      say('would run the schema sync');

      return;
    }

    await sync();
  };
};

/** The existence probes. They read on a dry run too, so it can report. */
const createProbes = (selector: Selector) => {
  return {
    countOf: async (args: SqlArgs) => {
      const rows = await selector<{ count: string }>(args);

      return Number(rows[0]?.count ?? 0);
    },
    tableExists: async ({ table }: { table: string }) => {
      const rows = await selector<{ exists: boolean }>({
        sql: 'SELECT to_regclass($1) IS NOT NULL AS exists',
        values: [`public.${quoteIdentifier(table)}`],
      });

      return Boolean(rows[0]?.exists);
    },
    columnExists: async ({
      table,
      column,
    }: {
      table: string;
      column: string;
    }) => {
      const rows = await selector<{ exists: boolean }>({
        sql: `SELECT EXISTS (SELECT 1
                               FROM information_schema.columns
                              WHERE table_schema = 'public'
                                AND table_name = $1
                                AND column_name = $2) AS exists`,
        values: [table, column],
      });

      return Boolean(rows[0]?.exists);
    },
    indexExists: async ({ index }: { index: string }) => {
      const rows = await selector<{ exists: boolean }>({
        sql: `SELECT EXISTS (SELECT 1
                               FROM pg_indexes
                              WHERE schemaname = 'public'
                                AND indexname = $1) AS exists`,
        values: [index],
      });

      return Boolean(rows[0]?.exists);
    },
  };
};

/** The three schema changes `sync` cannot make, each idempotent. */
const createAlters = (run: Runner) => {
  return {
    addColumnIfMissing: async ({
      table,
      column,
      type,
    }: {
      table: string;
      column: string;
      type: string;
    }) => {
      await run({
        sql: `ALTER TABLE ${quoteIdentifier(table)} ADD COLUMN IF NOT EXISTS ${quoteIdentifier(column)} ${type}`,
      });
    },
    setNotNull: async ({
      table,
      column,
    }: {
      table: string;
      column: string;
    }) => {
      await run({
        sql: `ALTER TABLE ${quoteIdentifier(table)} ALTER COLUMN ${quoteIdentifier(column)} SET NOT NULL`,
      });
    },
    dropColumnIfExists: async ({
      table,
      column,
    }: {
      table: string;
      column: string;
    }) => {
      await run({
        sql: `ALTER TABLE ${quoteIdentifier(table)} DROP COLUMN IF EXISTS ${quoteIdentifier(column)}`,
      });
    },
  };
};

export const createMigrationContext = (args: {
  client: Sequelize;
  dryRun: boolean;
  args: MigrationArgs;
  say: (message: string) => void;
  sync?: () => Promise<void>;
}): MigrationContext => {
  const { client, dryRun, args: migrationArgs, say, sync } = args;

  const selector = createSelector(client);
  const run = createRunner({ client, dryRun, say });

  return {
    client,
    dryRun,
    args: migrationArgs,
    say,
    select: selector,
    run,
    sync: createSync({ dryRun, say, sync }),
    ...createProbes(selector),
    ...createAlters(run),
  };
};
