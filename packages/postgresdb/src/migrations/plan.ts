import type { Sequelize } from '../sequelize-typescript';
import type { LedgerRow } from './ledger';
import { readLedger } from './ledger';
import type { Migration, MigrationArgs } from './types';

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

export const assertUniqueNames = (migrations: Migration[]): Set<string> => {
  const seen = new Set<string>();

  for (const { name } of migrations) {
    if (seen.has(name)) {
      throw new Error(`Duplicate migration name: "${name}"`);
    }

    seen.add(name);
  }

  return seen;
};

export const selectMigrations = (params: {
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

export const refuseUnknown = (unknown: LedgerRow[]): void => {
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
export const assertRequiredArgs = (params: {
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

export const statusReport = async (params: {
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

export const appliedNamesOf = (report: MigrationStatusReport): Set<string> => {
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
