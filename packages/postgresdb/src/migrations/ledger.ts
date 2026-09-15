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
 * Everything the ledger carries besides `name`, which is the primary key and
 * so can only come from the CREATE. Each one is nullable or has a default, so
 * adding it to a table that already holds rows always succeeds.
 *
 * A row here is how the ledger's own schema moves: see `ensureLedger`.
 */
const LEDGER_COLUMNS: [column: string, definition: string][] = [
  ['applied_at', 'TIMESTAMPTZ NOT NULL DEFAULT now()'],
  ['duration_ms', 'INTEGER NOT NULL DEFAULT 0'],
  ['version', 'VARCHAR(64)'],
  ['args', 'JSONB'],
  ['baseline', 'BOOLEAN NOT NULL DEFAULT false'],
];

/**
 * The runner owns its ledger table rather than the application's models: it
 * has to exist before the first migration runs, which is usually before the
 * models describe anything at all.
 *
 * The columns are added separately rather than trusted to the CREATE, because
 * `CREATE TABLE IF NOT EXISTS` does nothing at all to a table that already
 * exists — the same reason the migrations this runs exist in the first place.
 * Without this, a release that gave the ledger a new column would leave every
 * older deployment reading a column that is not there, and the runner would
 * fail before it could migrate anything.
 */
const ensureLedger = async ({ client, table }: LedgerArgs): Promise<void> => {
  const name = quoteIdentifier(table);

  await client.query(
    `CREATE TABLE IF NOT EXISTS ${name} ("name" VARCHAR(255) PRIMARY KEY)`
  );

  for (const [column, definition] of LEDGER_COLUMNS) {
    await client.query(
      `ALTER TABLE ${name} ADD COLUMN IF NOT EXISTS ${quoteIdentifier(column)} ${definition}`
    );
  }
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

/**
 * Whether the database holds anything besides the ledger itself.
 *
 * It is how the runner tells a database that predates the ledger from one that
 * is genuinely new: an empty ledger beside a populated schema means the
 * migrations may well have run before anything was recorded.
 */
export const hasApplicationTables = async ({
  client,
  table,
}: LedgerArgs): Promise<boolean> => {
  const rows = await select<{ count: string }>({
    client,
    sql: `SELECT count(*)::text AS count
            FROM information_schema.tables
           WHERE table_schema = 'public'
             AND table_type = 'BASE TABLE'
             AND table_name <> $1`,
    values: [table],
  });

  return Number(rows[0]?.count ?? 0) > 0;
};
