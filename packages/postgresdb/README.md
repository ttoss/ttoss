# @ttoss/postgresdb

A lightweight [Sequelize](https://sequelize.org/) wrapper for PostgreSQL databases with TypeScript support.

## Installation

```bash
pnpm add @ttoss/postgresdb
pnpm add -D @ttoss/postgresdb-cli
```

**ESM only**: Add `"type": "module"` to your `package.json`.

## Quick Start

### Database Setup

Use Docker to create a PostgreSQL instance:

```bash
docker run --name postgres-test -e POSTGRES_PASSWORD=mysecretpassword -d -p 5432:5432 postgres
```

Or with Docker Compose (`docker-compose.yml`):

```yaml
services:
  db:
    image: postgres
    environment:
      POSTGRES_PASSWORD: mysecretpassword
    volumes:
      - db-data:/var/lib/postgresql/data
    ports:
      - '5432:5432'

volumes:
  db-data:
```

```bash
docker compose up -d
```

### Define Models

Create `models/User.ts`:

```typescript
import { Table, Column, Model } from '@ttoss/postgresdb';

@Table
export class User extends Model {
  @Column
  declare name: string;

  @Column
  declare email: string;
}
```

**Important:** You must use the `declare` keyword on class properties to ensure TypeScript doesn't emit them as actual fields. Without `declare`, public class fields would shadow Sequelize's getters and setters, blocking access to the model's data. See [Sequelize documentation on public class fields](https://sequelize.org/docs/v6/core-concepts/model-basics/#caveat-with-public-class-fields) for details.

_All [sequelize-typescript](https://github.com/sequelize/sequelize-typescript) decorators are available._

Export in `models/index.ts`:

```typescript
export { User } from './User';
```

### Initialize Database

Create `src/db.ts`:

```typescript
import { initialize } from '@ttoss/postgresdb';
import * as models from './models';

export const db = await initialize({ models });
```

### Configuration

**Option 1 - Direct configuration:**

```typescript
export const db = initialize({
  database: 'mydb',
  username: 'user',
  password: 'pass',
  host: 'localhost',
  port: 5432,
  models,
});
```

**Option 2 - Environment variables (`.env`):**

```env
DATABASE_NAME=postgres
DATABASE_USER=postgres
DATABASE_PASSWORD=mysecretpassword
DATABASE_HOST=localhost
DATABASE_PORT=5432
```

Environment variables are automatically used if defined.

### Sync Schema

[Synchronize](https://sequelize.org/docs/v6/core-concepts/model-basics/#model-synchronization) database schema with models:

```bash
pnpm dlx @ttoss/postgresdb-cli sync
```

This imports `db` from `src/db.ts` and syncs the schema.

### Advisory-Locked Sync (multi-instance boot)

Calling `sequelize.sync({ alter: true })` on boot behind more than one instance
(rolling deploys, auto-scale-out, instance refresh) races: the generated
`ALTER TABLE` DDL runs concurrently against the same database and can deadlock,
error, or leave the schema inconsistent.

`syncWithAdvisoryLock` serializes it on a Postgres session-level advisory lock
held on one dedicated connection, released on both the success and failure
paths. One instance syncs; the others block, then meet the migrated schema and
no-op. `key` is caller-chosen and must stay constant across releases so every
instance competes for the same lock.

```typescript
import { syncWithAdvisoryLock } from '@ttoss/postgresdb';

await syncWithAdvisoryLock({
  sequelize,
  key: 0x50a7_5c_00, // stable, caller-chosen 64-bit key kept constant across releases
  sync: { alter: true },
});
```

You can also run it as part of `initialize` via the `syncLock` option:

```typescript
const db = await initialize({
  models,
  syncLock: { key: 0x50a7_5c_00, sync: { alter: true } },
});
```

The lock blocks rather than tries (`pg_advisory_lock`, not
`pg_try_advisory_lock`): a waiter must wait out the holder, never skip the sync.

### CRUD Operations

All models are accessible via the `db` object. See [Sequelize documentation](https://sequelize.org/master/manual/model-querying-basics.html) for complete query API.

```typescript
import { db } from './db';

const user = await db.User.create({
  name: 'John Doe',
  email: 'johndoe@email.com',
});
```

## Migrations

`sequelize.sync()` creates missing _tables_. It never adds a column to an
existing one, nor drops one, so a release that changes a populated table needs
a migration: add the column nullable, sync so the indexes land, backfill, then
apply the constraint the models declare.

Declare each one with `defineMigration` and export them in the order they run:

```typescript
// src/migrations.ts
import { defineMigration } from '@ttoss/postgresdb';

import { syncSchema } from './sync';

export const sync = syncSchema;

export const migrations = [
  defineMigration({
    name: 'add-project-id',
    description: 'Gives every task a project.',
    options: [
      {
        flag: 'owner-email',
        description: 'Who owns the rows that predate projects.',
        required: true,
      },
    ],
    up: async (ctx) => {
      if (!(await ctx.tableExists({ table: 'tasks' }))) {
        ctx.say('no tasks table yet, nothing to migrate');

        return;
      }

      await ctx.addColumnIfMissing({
        table: 'tasks',
        column: 'project_id',
        type: 'INTEGER',
      });

      // Now the column exists, the sync can build the index over it.
      await ctx.sync();

      await ctx.run({
        sql: 'UPDATE tasks SET project_id = $1 WHERE project_id IS NULL',
        values: [await projectFor(ctx.args['owner-email'])],
      });

      await ctx.setNotNull({ table: 'tasks', column: 'project_id' });
    },
  }),
];
```

Run them from the application's own entrypoint, which is what an image does
because it carries `dist` rather than sources:

```typescript
// src/migrateCli.ts
import { runMigrationsCli } from '@ttoss/postgresdb';

import { migrations, sync } from './migrations';

runMigrationsCli({
  argv: process.argv.slice(2),
  bin: 'migrate',
  migrations,
  sync,
  version: process.env.APP_VERSION,
}).then((code) => {
  process.exitCode = code;
});
```

```bash
migrate status                         # every migration, and when it was applied
migrate run --dry-run                  # what a real run would do; writes nothing
migrate run --owner-email ana@acme.com # apply everything pending
migrate run add-project-id             # apply only this one, if it is pending
```

### Atomicity is per `run`

`ctx.run` executes through the Sequelize pool, so two calls can land on
different connections: `BEGIN` in one and `COMMIT` in another is not a
transaction. What is atomic is a single `run` — Postgres wraps all the
statements of one multi-statement simple query in an implicit transaction. A
step that must not half-land goes in one `run`, as one string.

**Multi-statement SQL and `values` are mutually exclusive.** Bind parameters
put the query on the extended protocol, which carries exactly one statement. A
multi-statement `run` therefore takes no `values`, so anything interpolated
into it must be a literal you control.

**In a deploy, `migrate run` comes before `sync`, never after.** `sync` builds
today's models, so it creates the indexes today's models declare — over columns
a pending migration has not added yet. Run first it does not skip them, it
fails, inside `addIndex`, and takes the deploy with it before the migration that
would have added the column ever ran:

```bash
migrate run    # first: bring the schema up to what this release expects
sync           # then: create whatever tables are simply missing
```

The sync a migration needs is the one it calls itself, at the step its own
schema can take one. The standalone `sync` is for the case no migration covers:
a fresh database, where every `isApplied` answers true and nothing else would
create the tables.

**Nothing runs a migration's `up()` until the deployment does.** A suite over
migrations asks `isApplied`; `--dry-run` exercises the probe and writes nothing;
there is no `down`. So run a new migration once by hand before it merges, against
the schema it is written for: `sync` today's models, undo your own change on a
scratch database, run `migrate run` then `sync`, and check that it applied, that
the change is back, that the write it was _for_ works, and that a second run
applies nothing. By hand rather than as a test — the wind-back differs for every
migration, and each `up()` runs exactly once, on one database, ever.

During development, `@ttoss/postgresdb-cli` runs the same commands against
`src/migrations.ts` without building first:

```bash
pnpm dlx @ttoss/postgresdb-cli migrate -e Development run --dry-run
```

### The ledger

Each migration that finishes is recorded in a `schema_migrations` table, so a
deploy can run `migrate run` on every release and only what is pending happens.
The runner creates the table itself; there is nothing to add to your models.

| Column        | What it answers                                             |
| ------------- | ----------------------------------------------------------- |
| `name`        | Which migration. The primary key, so each runs at most once |
| `applied_at`  | When                                                        |
| `duration_ms` | How long it took                                            |
| `version`     | Which release ran it, from the runner's `version`           |
| `args`        | What it was told, limited to the flags it declares          |
| `baseline`    | Whether it was recorded without running — see below         |

**The ledger records what finished, not what half-ran.** A migration that
throws leaves no row and is retried from the top on the next run, so every
migration must be idempotent as well: guard with `tableExists` and
`columnExists`, and prefer the `IF NOT EXISTS` helpers.

The table reconciles its own columns on every read, adding any this version
expects that an older one did not create. It has to: `CREATE TABLE IF NOT
EXISTS` does nothing whatever to a table that already exists, which is the same
reason the migrations it records have to exist at all.

Runs are serialized across instances with the same advisory lock mechanism as
`syncWithAdvisoryLock`, on a key of their own. A migration that calls
`ctx.sync()` reaches your `syncWithAdvisoryLock` on another connection, so the
two keys must differ — the defaults already do. Give the runner the plain sync
rather than the locked one: it already holds its lock for the whole run.

**Reading the ledger is a write.** `status()` — and anything else that reads the
table — runs `CREATE TABLE IF NOT EXISTS` first, which is not race-safe:
concurrent creators collide on the system catalogue. Do not call it from
something that runs on every instance, such as a boot-time check across a
rolling deploy. Query the table directly instead, treating "not there" as
"nothing applied":

```sql
SELECT to_regclass('public.schema_migrations') IS NOT NULL AS present
```

**Names are the identity.** Renaming or deleting a migration that has already
run leaves the ledger holding a name nothing declares, and the runner then
refuses to run rather than silently skipping it.

### Adopting the ledger on a database that predates it

A database migrated by hand already has the schema, but no ledger to say so.
An empty ledger beside a populated schema is genuinely ambiguous — the database
could be new, or it could be one that was migrated before anything was
recorded — and guessing "new" re-runs history. So the runner does not guess.

**It refuses**, naming what it cannot decide:

```
This database already holds tables but its migration ledger is empty, so the
runner cannot tell a new database from one migrated before the ledger existed.
If these migrations already ran against it, record them with `baseline` (or
`baseline --all`). If they genuinely never ran, re-run with --allow-unbaselined.
```

There are three ways out, and the first is usually right:

```bash
migrate baseline --all           # they already ran: record them, run nothing
migrate baseline add-project-id  # or name just the ones that already ran
migrate run --allow-unbaselined  # they never ran: this database only looks old
```

`baseline` writes to the ledger only and never touches the schema. Run it once
per environment, as a step of the release that introduces the ledger.

The guard is narrow on purpose. It fires only when the ledger is **completely**
empty, so a later release that adds a migration to an adopted database needs
nothing; and an empty database trips nothing, because there is no history it
could be hiding.

#### Letting a migration answer for itself

The other way out is for the migration to recognise its own work, from the
schema rather than from the ledger. A migration that can do that declares
`isApplied`, and the runner records it instead of running it:

```typescript
defineMigration({
  name: 'add-project-id',
  up: async (ctx) => {
    await ctx.addColumnIfMissing({
      table: 'tasks',
      column: 'project_id',
      type: 'INTEGER',
    });
  },
  // The change is its own evidence: if the column is there, this has run.
  isApplied: async (ctx) => {
    return ctx.columnExists({ table: 'tasks', column: 'project_id' });
  },
});
```

A probe that answers — either way — resolves the ambiguity, so it also takes
that migration out of what the guard refuses. The context it receives is always
in dry-run mode, so a write attempted from a probe is reported, never performed.

**Every probe runs before any `up()`.** The runner evaluates all pending
`isApplied` probes first, then applies what is left, so a probe answers for the
database as it stands now — never as an earlier pending migration will leave
it. Where two pending migrations touch the same table, distinguish the states
explicitly rather than testing one column.

Only declare one when the answer is certain: a probe that guesses wrong skips
work that was never done. A migration that leaves no trace to recognise — a
pure data rewrite — declares none, and the operator baselines it.

### Migration context

`up` receives a context that runs raw SQL on the runner's own connection,
deliberately beside the ORM: a migration running through the models would
describe the schema it is in the middle of changing.

| Member                                        | What it does                                                             |
| --------------------------------------------- | ------------------------------------------------------------------------ |
| `select({ sql, values })`                     | Rows out. Always executes, even on a dry run                             |
| `run({ sql, values })`                        | Any statement that writes. Skipped on a dry run                          |
| `countOf({ sql, values })`                    | One number out of a `count(*)`                                           |
| `tableExists`, `columnExists`, `indexExists`  | Probes, so a fresh database is a no-op                                   |
| `addColumnIfMissing({ table, column, type })` | `ADD COLUMN IF NOT EXISTS`, nullable                                     |
| `setNotNull`, `dropColumnIfExists`            | Idempotent by construction                                               |
| `sync()`                                      | The application's schema sync, when the runner was given one             |
| `say(message)`                                | A progress line                                                          |
| `args`, `dryRun`, `client`                    | What it was told, whether to write, and the connection for anything else |

`--dry-run` makes every write helper report what it would do and do nothing,
while the probes still read, so a dry run can report what a real one would
change. It writes no ledger row either.

Because a dry run writes nothing, a migration that depends on a schema change
an _earlier pending_ migration would have made will fail during it — the column
it probes is not there yet. A dry run answers for the next migration against
the schema you have, not for a whole unapplied chain.

## Vector Support (pgvector)

This package includes built-in support for [pgvector](https://github.com/pgvector/pgvector), enabling vector similarity search for AI/ML applications like semantic search, recommendations, and RAG systems.

### Setup

Enable pgvector by setting `createVectorExtension: true` when initializing:

```typescript
import { initialize } from '@ttoss/postgresdb';
import * as models from './models';

export const db = await initialize({
  models,
  createVectorExtension: true, // Automatically creates the pgvector extension
});
```

This automatically executes `CREATE EXTENSION IF NOT EXISTS vector` on your database.

### Using VECTOR Type

Define vector columns using `DataType.VECTOR(dimensions)`:

```typescript
import { Table, Column, Model, DataType } from '@ttoss/postgresdb';

@Table
class Document extends Model {
  @Column
  declare content: string;

  @Column({
    type: DataType.VECTOR(1536), // 1536-dimensional vector (e.g., OpenAI embeddings)
    allowNull: true,
  })
  declare embedding: number[];
}
```

### Vector Operations

```typescript
import { db } from './db';

// Create document with embedding
const doc = await db.Document.create({
  content: 'Machine learning tutorial',
  embedding: [0.1, 0.2, 0.3, ...], // 1536-dimensional array
});

// Find similar documents using cosine distance
const similar = await db.Document.findAll({
  order: sequelize.literal(`embedding <=> '[0.1, 0.2, 0.3, ...]'`),
  limit: 5,
});
```

For advanced vector operations and indexing, see the [pgvector documentation](https://github.com/pgvector/pgvector#readme).

## Monorepo Usage

Share models across packages with this setup:

**In the database package (`@yourproject/postgresdb`):**

`package.json`:

```json
{
  "type": "module",
  "exports": "./src/index.ts"
}
```

`src/index.ts`:

```typescript
export * as models from './models';
```

_Don't export `db` here - each package may need different configurations._

**In consuming packages:**

Add dependencies to `package.json`:

```json
{
  "dependencies": {
    "@ttoss/postgresdb": "^x.x.x",
    "@yourproject/postgresdb": "workspace:^"
  }
}
```

Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["src", "../postgresdb/src"]
}
```

Create `src/db.ts`:

```typescript
import { initialize } from '@ttoss/postgresdb';
import { models } from '@yourproject/postgresdb';

export const db = initialize({ models });
```

## Testing

Jest's Babel transformer does not transpile TypeScript decorators, so tests
must import models from the compiled output (`dist/index`) rather than from
source ([why](https://stackoverflow.com/a/53920890/8786986)). Build before
testing.

Tests over models are also the check that `sync --alter` will not drop a
column: a property missing from a model fails here rather than in production.

### Setup

**1. Install dependencies:**

```bash
pnpm add -D @testcontainers/postgresql jest @types/jest
```

**2. Configure `tsconfig.json`:**

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

These options are required for decorator support. Without them, TypeScript won't properly compile decorator metadata.

**3. Add build script to `package.json`:**

```json
{
  "scripts": {
    "build": "tsup",
    "pretest": "pnpm run build",
    "test": "jest"
  }
}
```

The `pretest` script ensures models are built before tests run.

### Test Example

```typescript
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { initialize, Sequelize } from '@ttoss/postgresdb';
import { models } from 'dist/index'; // Import from built output

let sequelize: Sequelize;
let postgresContainer: StartedPostgreSqlContainer;

jest.setTimeout(60000);

beforeAll(async () => {
  // Start PostgreSQL container
  postgresContainer = await new PostgreSqlContainer('postgres:17').start();

  // Initialize database with container credentials
  const db = await initialize({
    models,
    logging: false,
    username: postgresContainer.getUsername(),
    password: postgresContainer.getPassword(),
    database: postgresContainer.getDatabase(),
    host: postgresContainer.getHost(),
    port: postgresContainer.getPort(),
  });

  sequelize = db.sequelize;

  // Sync database schema
  await sequelize.sync();
});

afterAll(async () => {
  await sequelize.close();
  await postgresContainer.stop();
});

describe('User model', () => {
  test('should create and retrieve user', async () => {
    const userData = { email: 'test@example.com' };
    const user = await models.User.create(userData);

    const foundUser = await models.User.findByPk(user.id);
    expect(foundUser).toMatchObject(userData);
  });
});
```

## API Reference

### `initialize(options)`

Initializes database connection and loads models.

**Options:** All [Sequelize options](https://sequelize.org/api/v6/class/src/sequelize.js~sequelize#instance-constructor-constructor) except `dialect` (always `postgres`), plus:

- `models` (required): Object mapping model names to model classes
- `createVectorExtension` (optional): Creates the pgvector extension when `true`
- `syncLock` (optional): Runs an advisory-locked `sequelize.sync()` after connecting. Accepts `{ key, sync }` — see `syncWithAdvisoryLock`

### `syncWithAdvisoryLock(options)`

Serializes a boot-time `sequelize.sync()` across concurrently-starting instances using a Postgres session-level advisory lock.

**Options:**

- `sequelize` (required): The Sequelize instance to synchronize
- `key` (required): A stable, caller-chosen 64-bit integer used as the advisory lock key. Keep it constant across releases
- `sync` (optional): Options forwarded to `sequelize.sync()` (e.g. `{ alter: true }`)

### `createMigrationRunner(options)`

Builds a runner over an application's migrations, backed by a ledger table.
Returns `{ status, run, baseline, close }`.

**Options:**

- `migrations` (required): Built with `defineMigration`, in the order they run
- `sync` (optional): The application's schema sync, reached as `ctx.sync()`
- `sequelize` (optional): The connection to use. Omitted, the runner opens its own from `DATABASE_*` and closes it on `close()`
- `lockKey` (optional): Advisory lock key. Must differ from the application's sync lock key
- `lockTimeoutMs` (optional): Bound on waiting for the lock — see `syncWithAdvisoryLock`
- `ledgerTable` (optional): Defaults to `schema_migrations`
- `version` (optional): Recorded with every migration this run applies
- `log` (optional): Where progress goes. Defaults to stderr

### `runMigrationsCli(options)`

Parses `argv`, drives a runner, and resolves to the exit code rather than
calling `process.exit`, so the caller decides how the process ends. Takes every
`createMigrationRunner` option plus `argv`, `bin` and `print`.

### Decorators

All [sequelize-typescript](https://www.npmjs.com/package/sequelize-typescript) decorators are exported: `@Table`, `@Column`, `@ForeignKey`, etc.

#### Hooks

Every sequelize-typescript lifecycle hook decorator is exported —
`@BeforeCreate`, `@AfterFind`, `@BeforeBulkUpdate` and the rest. See the
[sequelize-typescript hooks documentation](https://github.com/sequelize/sequelize-typescript#hooks)
for the full list and semantics.

### DataType

All standard Sequelize data types are available through `DataType`, including:

- **`DataType.VECTOR(dimensions)`**: PostgreSQL vector type for storing embeddings (requires [pgvector](https://github.com/pgvector/pgvector) extension). Use for AI/ML applications like semantic search and recommendations.

Example:

```typescript
import { Column, DataType } from '@ttoss/postgresdb';

@Column({
  type: DataType.VECTOR(768), // 768-dimensional vector
  allowNull: true,
})
declare embedding: number[];
```

See [Sequelize DataTypes documentation](https://sequelize.org/docs/v6/core-concepts/model-basics/#data-types) for all available types.

### Types

#### `ModelColumns<T>`

Extracts column types from a model:

```typescript
import { Column, Model, type ModelColumns, Table } from '@ttoss/postgresdb';

@Table
class User extends Model {
  @Column
  declare name?: string;

  @Column
  declare email: string;
}

// Inferred type: { name?: string; email: string; }
type UserColumns = ModelColumns<User>;
```
