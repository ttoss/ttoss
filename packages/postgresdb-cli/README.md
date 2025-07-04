# @ttoss/postgresdb-cli

This package provides a CLI to interact with a PostgreSQL database using the [sequelize](https://sequelize.org/) library.

## Installation

```bash
pnpm add -D @ttoss/postgresdb-cli
```

## Usage

First, you need to create define the `db` object in your project using the `@ttoss/postgresdb` package. Check [@ttoss/postgresdb documentation](https://ttoss.dev/docs/modules/packages/postgresdb/) for more information. The CLI will use this object to load the models and interact with the database.

Second, you need to define the following environment variables to connect to the database:

- `DB_NAME`: database name
- `DB_USERNAME`: database username
- `DB_PASSWORD`: database password
- `DB_HOST`: database host
- `DB_PORT`: database port. Default: 5432

### Sync

To [sync](https://sequelize.org/docs/v6/core-concepts/model-basics/#model-synchronization) the database schema with the models, you can use the `sync` command:

```bash
pnpm dlx @ttoss/postgresdb-cli sync
```

Or you can add the command to your `package.json` scripts for easier access:

```json
{
  "scripts": {
    "sync": "ttoss-postgresdb sync"
  }
}
```

#### Options

- `--db-path` or `-d`: Path to the file where the `db` object is defined. Default: `./src/db.js`.
- `--alter`: Alter the database schema to match the models. Default: `false`.

### ERD (Entity-Relationship Diagram)

To generate an [ERD](https://en.wikipedia.org/wiki/Entity%E2%80%93relationship_model) of the database, you can use the `erd` command:

```bash
pnpm dlx @ttoss/postgresdb-cli erd
```

Or you can add the command to your `package.json` scripts for easier access:

```json
{
  "scripts": {
    "erd": "ttoss-postgresdb erd"
  }
}
```

#### Options

- `--db-path` or `-d`: Path to the file where the `db` object is defined. Default: `./src/db.js`.
- `--engine`: Layout engine to use, options are "circo", "dot", "fdp", "neato", "osage", "twopi". Default to "circo"
