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
export class User extends Model<User> {
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
DB_NAME=postgres
DB_USERNAME=postgres
DB_PASSWORD=mysecretpassword
DB_HOST=localhost
DB_PORT=5432
```

Environment variables are automatically used if defined.

### Sync Schema

[Synchronize](https://sequelize.org/docs/v6/core-concepts/model-basics/#model-synchronization) database schema with models:

```bash
pnpm dlx @ttoss/postgresdb-cli sync
```

This imports `db` from `src/db.ts` and syncs the schema.

### CRUD Operations

All models are accessible via the `db` object. See [Sequelize documentation](https://sequelize.org/master/manual/model-querying-basics.html) for complete query API.

```typescript
import { db } from './db';

const user = await db.User.create({
  name: 'John Doe',
  email: 'johndoe@email.com',
});
```

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

Testing models with decorators requires special configuration because Jest's Babel transformer doesn't properly transpile TypeScript decorators. The solution is to build your models before running tests.

**Why test your models?** Beyond validating functionality, tests serve as a critical safety check for schema changes. They ensure that running `sync --alter` won't accidentally remove columns or relationships from your database. If a model property is missing or incorrectly defined, tests will fail before you can damage production data.

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

### Key Points

- **Import from `dist/`**: Tests must import models from the compiled output (`dist/index`), not source files, because decorators aren't transpiled by Jest's Babel transformer. See [this Stack Overflow answer](https://stackoverflow.com/a/53920890/8786986) for details.
- **Testcontainers**: Use [`@testcontainers/postgresql`](https://www.npmjs.com/package/@testcontainers/postgresql) to spin up isolated PostgreSQL instances for each test run.
- **Timeout**: Set a longer timeout with `jest.setTimeout(60000)` as container startup can take time.
- **Sync schema**: Call `sequelize.sync()` after initialization to create tables based on your models.
- **Schema validation**: Tests verify that all model properties are correctly defined. This prevents `sync --alter` from accidentally removing database columns due to missing or misconfigured model properties.

For a complete working example with full test configuration, see the [terezinha-farm/postgresdb](https://github.com/ttoss/ttoss/tree/main/terezinha-farm/postgresdb) example in this repository.

## API Reference

### `initialize(options)`

Initializes database connection and loads models.

**Options:** All [Sequelize options](https://sequelize.org/api/v6/class/src/sequelize.js~sequelize#instance-constructor-constructor) except `dialect` (always `postgres`), plus:

- `models` (required): Object mapping model names to model classes

### Decorators

All [sequelize-typescript](https://www.npmjs.com/package/sequelize-typescript) decorators are exported: `@Table`, `@Column`, `@ForeignKey`, etc.

### Types

#### `ModelColumns<T>`

Extracts column types from a model:

```typescript
import { Column, Model, type ModelColumns, Table } from '@ttoss/postgresdb';

@Table
class User extends Model<User> {
  @Column
  declare name?: string;

  @Column
  declare email: string;
}

// Inferred type: { name?: string; email: string; }
type UserColumns = ModelColumns<User>;
```
