import type { Sequelize } from '../sequelize-typescript';

/**
 * The values a migration received on the command line, keyed by flag name
 * without the leading dashes. A flag given without a value is `true`.
 */
export type MigrationArgs = Record<string, string | true>;

/**
 * A flag a migration accepts beyond `--dry-run`. Declared so the runner can
 * refuse a run that lacks a required one before any migration has started,
 * and print it in `--help`.
 */
export type MigrationOption = {
  /** The flag name, without dashes: `owner-email` is read as `--owner-email`. */
  flag: string;
  description: string;
  /** Whether a run that includes this migration must supply the flag. */
  required?: boolean;
};

export type SqlArgs = {
  sql: string;
  values?: unknown[];
};

export type ColumnArgs = {
  table: string;
  column: string;
};

/**
 * What a migration's `up` receives. The helpers run raw SQL on a connection
 * that belongs to the runner, deliberately beside the ORM: a migration running
 * through the models would describe the schema it is in the middle of
 * changing.
 */
export type MigrationContext = {
  /** The runner's own Sequelize instance, for anything the helpers do not cover. */
  client: Sequelize;
  /**
   * When true, every write helper (`run`, `sync`, `addColumnIfMissing`,
   * `setNotNull`, `dropColumnIfExists`) logs what it would do and does
   * nothing. `select` and the existence probes still read, so a migration can
   * report what a real run would change.
   */
  dryRun: boolean;
  args: MigrationArgs;
  /** Progress lines, written through the runner's logger. */
  say: (message: string) => void;
  /**
   * The application's schema sync, when the runner was given one. A migration
   * calls it after making a column exist and before applying the constraints
   * the models declare, so the sync can create the indexes over it.
   */
  sync: () => Promise<void>;
  /** `SELECT` rows out. Always executes, even on a dry run. */
  select: <T>(args: SqlArgs) => Promise<T[]>;
  /** Any statement that writes. Skipped on a dry run. */
  run: (args: SqlArgs) => Promise<void>;
  /** One number out of a `count(*)`, which Postgres returns as a bigint string. */
  countOf: (args: SqlArgs) => Promise<number>;
  tableExists: (args: { table: string }) => Promise<boolean>;
  columnExists: (args: ColumnArgs) => Promise<boolean>;
  indexExists: (args: { index: string }) => Promise<boolean>;
  /**
   * `ALTER TABLE … ADD COLUMN IF NOT EXISTS`, nullable. `type` is SQL and is
   * inlined, so it must come from the migration, never from its arguments.
   */
  addColumnIfMissing: (args: ColumnArgs & { type: string }) => Promise<void>;
  /** Idempotent: Postgres accepts `SET NOT NULL` on a column that has it. */
  setNotNull: (args: ColumnArgs) => Promise<void>;
  dropColumnIfExists: (args: ColumnArgs) => Promise<void>;
};

export type Migration = {
  /**
   * The identity of the migration in the ledger. Kebab-case by convention
   * (`add-project-id`). Renaming one after it has run anywhere makes the
   * runner refuse to start, because the ledger would hold a name nothing
   * declares.
   */
  name: string;
  /** One paragraph on what it does and why `sync` could not. Shown by `status`. */
  description?: string;
  options?: MigrationOption[];
  /**
   * The migration. It must be idempotent: the ledger records what finished,
   * not what half-ran, so a failed attempt is retried from the top on the next
   * run.
   */
  up: (context: MigrationContext) => Promise<void>;
};

/**
 * Identity function that gives a migration literal its type without an
 * annotation.
 */
export const defineMigration = (migration: Migration): Migration => {
  return migration;
};
