import type { Sequelize } from '../sequelize-typescript';
import { quoteIdentifier, select } from './context';
import type { MigrationArgs } from './types';

export const DEFAULT_LEDGER_TABLE = 'schema_migrations';

export type LedgerRow = {
  name: string;
  applied_at: Date;
  duration_ms: number;
  version: string | null;
  args: MigrationArgs | null;
  /** Recorded without running, by `baseline`. */
  baseline: boolean;
};

type LedgerArgs = {
  client: Sequelize;
  table: string;
};

/**
 * The runner owns its ledger table rather than the application's models: it
 * has to exist before the first migration runs, which is usually before the
 * models describe anything at all.
 */
const ensureLedger = async ({ client, table }: LedgerArgs): Promise<void> => {
  await client.query(
    `CREATE TABLE IF NOT EXISTS ${quoteIdentifier(table)} (
       "name"        VARCHAR(255) PRIMARY KEY,
       "applied_at"  TIMESTAMPTZ  NOT NULL DEFAULT now(),
       "duration_ms" INTEGER      NOT NULL DEFAULT 0,
       "version"     VARCHAR(64),
       "args"        JSONB,
       "baseline"    BOOLEAN      NOT NULL DEFAULT false
     )`
  );
};

export const readLedger = async ({
  client,
  table,
}: LedgerArgs): Promise<Map<string, LedgerRow>> => {
  await ensureLedger({ client, table });

  const rows = await select<LedgerRow>({
    client,
    sql: `SELECT "name", "applied_at", "duration_ms", "version", "args", "baseline"
            FROM ${quoteIdentifier(table)}
           ORDER BY "applied_at" ASC, "name" ASC`,
  });

  return new Map(
    rows.map((row) => {
      return [row.name, row];
    })
  );
};

export const recordMigration = async (
  args: LedgerArgs & {
    name: string;
    durationMs: number;
    version?: string;
    args: MigrationArgs | null;
    baseline: boolean;
  }
): Promise<void> => {
  const {
    client,
    table,
    name,
    durationMs,
    version,
    args: migrationArgs,
    baseline,
  } = args;

  await client.query(
    `INSERT INTO ${quoteIdentifier(table)} ("name", "duration_ms", "version", "args", "baseline")
     VALUES ($1, $2, $3, $4::jsonb, $5)
     ON CONFLICT ("name") DO NOTHING`,
    {
      bind: [
        name,
        durationMs,
        version ?? null,
        migrationArgs ? JSON.stringify(migrationArgs) : null,
        baseline,
      ],
    }
  );
};
