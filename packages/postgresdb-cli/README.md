# @ttoss/postgresdb-cli

CLI for managing PostgreSQL databases with [Sequelize](https://sequelize.org/).

## Installation

```bash
pnpm add -D @ttoss/postgresdb-cli
```

## Prerequisites

Define your `db` object using [@ttoss/postgresdb](https://ttoss.dev/docs/modules/packages/postgresdb/). The CLI imports this object to load models and interact with the database.

Set connection environment variables in `.env` files:

```env
DATABASE_NAME=postgres
DATABASE_USER=postgres
DATABASE_PASSWORD=mysecretpassword
DATABASE_HOST=localhost
DATABASE_PORT=5432
```

**Environment-specific configuration:** Use `--environment` or `-e` flag to load `.env.<environment>` files (e.g., `.env.Production`, `.env.Staging`) instead of the default `.env`. This prevents accidental use of production credentials.

## Commands

### `sync`

[Synchronize](https://sequelize.org/docs/v6/core-concepts/model-basics/#model-synchronization) database schema with models:

```bash
pnpm dlx @ttoss/postgresdb-cli sync -e Development
```

**⚠️ Required:** The `--environment` or `-e` flag is **mandatory** to explicitly specify which environment credentials to use. This prevents accidental operations on the wrong database.

**Using environment-specific credentials:**

```bash
pnpm dlx @ttoss/postgresdb-cli sync --alter -e Production
```

This loads variables from `.env.Production`.

**Behavior:**

- **Without `--alter`**: Creates new tables only (preserves existing schema)
- **With `--alter`**: Creates new tables, adds/removes columns to match models, creates new indexes (preserves tables and indexes not in models). **Requires confirmation** before executing.

⚠️ **Caution:** The `--alter` flag modifies your database schema. Removing columns will **delete data permanently**. The CLI will prompt for confirmation before proceeding. Always backup your database before using `--alter` in production. For production environments, use proper migration tools instead of `sync`.

**Testing before using `--alter`:** Always ensure your models have comprehensive tests before running `sync --alter`. Tests validate that all model properties are correctly defined and prevent accidental column removal. If a column is missing from your model definition, `--alter` will drop it from the database. See the [@ttoss/postgresdb testing guide](https://ttoss.dev/docs/modules/packages/postgresdb/#testing) for details on setting up model tests.

**Add to `package.json` for convenience:**

```json
{
  "scripts": {
    "sync": "ttoss-postgresdb sync"
  }
}
```

Then run `pnpm sync -e Development` or `pnpm sync --alter -e Production` from the command line.

**Options:**

- `--db-path, -d`: Path to `db` object file (default: `./src/db.js`)
- `--alter`: Alter schema to match models (default: `false`)
- `--environment, -e`: **(Required)** Specify environment to load `.env.<environment>` file

### `migrate`

Run the migrations a project exports, recorded in a ledger so only what is
pending happens. `sync` creates missing tables and never alters an existing
one, so a release that changes a populated table needs one of these instead.

The project exports them from `src/migrations.ts` (or `--migrations-path`),
built with `defineMigration` from [@ttoss/postgresdb](https://ttoss.dev/docs/modules/packages/postgresdb/),
which documents how to write one and what the ledger records:

```typescript
// src/migrations.ts
import { defineMigration } from '@ttoss/postgresdb';

export const sync = async () => {
  /* the project's own schema sync, reached as ctx.sync() */
};

export const migrations = [
  defineMigration({
    name: 'add-project-id',
    up: async (ctx) => {
      await ctx.addColumnIfMissing({
        table: 'tasks',
        column: 'project_id',
        type: 'INTEGER',
      });
      await ctx.sync();
      await ctx.setNotNull({ table: 'tasks', column: 'project_id' });
    },
  }),
];
```

```bash
pnpm dlx @ttoss/postgresdb-cli migrate -e Development status
pnpm dlx @ttoss/postgresdb-cli migrate -e Development run --dry-run
pnpm dlx @ttoss/postgresdb-cli migrate -e Development run
```

**Commands:**

- `status`: Every migration and when it was applied. Exits `1` if the ledger holds a name nothing declares
- `run [name...]`: Applies what is pending, or only the named ones. `--dry-run` reports and writes nothing
- `baseline (<name...> | --all)`: Records migrations as applied without running them, for a database migrated before the ledger existed
- `help`

Running against a database that already has tables while its ledger is empty is
refused, because the runner cannot tell a new database from one migrated before
the ledger existed. Use `baseline` when those migrations already ran, or
`run --allow-unbaselined` when they genuinely never did. See the
[@ttoss/postgresdb](https://ttoss.dev/docs/modules/packages/postgresdb/) docs
for how a migration can answer that question for itself.

Flags a migration declares are passed straight through: `run --owner-email ana@acme.com`.
A run missing a required one fails before any migration starts.

**Options:**

- `--migrations-path, -m`: File exporting `migrations` and, optionally, `sync` (default: `src/migrations.ts`)
- `--tag`: Recorded with every migration this run applies, e.g. the release version
- `--environment, -e`: **(Required)** Specify environment to load `.env.<environment>` file

This command bundles the project's sources on every run, so it is the local
development face. A deployed image carries `dist` rather than sources and calls
`runMigrationsCli` from its own entrypoint instead.

### `erd`

Generate an [Entity-Relationship Diagram](https://en.wikipedia.org/wiki/Entity%E2%80%93relationship_model) from your models:

```bash
pnpm dlx @ttoss/postgresdb-cli erd
```

**Note:** This command generates diagrams from model definitions only - database credentials are **not required** unless you need to validate against an actual database.

**Add to `package.json` for convenience:**

```json
{
  "scripts": {
    "erd": "ttoss-postgresdb erd"
  }
}
```

**Options:**

- `--db-path, -d`: Path to `db` object file (default: `./src/db.js`)
- `--engine`: Layout engine - `circo`, `dot`, `fdp`, `neato`, `osage`, `twopi` (default: `circo`)
