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
DB_NAME=postgres
DB_USERNAME=postgres
DB_PASSWORD=mysecretpassword
DB_HOST=localhost
DB_PORT=5432
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

**Add to `package.json` for convenience:**

```json
{
  "scripts": {
    "sync:dev": "ttoss-postgresdb sync -e Development",
    "sync:staging": "ttoss-postgresdb sync --alter -e Staging",
    "sync:prod": "ttoss-postgresdb sync --alter -e Production"
  }
}
```

**Options:**

- `--db-path, -d`: Path to `db` object file (default: `./src/db.js`)
- `--alter`: Alter schema to match models (default: `false`)
- `--environment, -e`: **(Required)** Specify environment to load `.env.<environment>` file

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
