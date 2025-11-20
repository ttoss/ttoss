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
  "include": ["src", "../postgresdb/src"]
}
```

Create `src/db.ts`:

```typescript
import { initialize } from '@ttoss/postgresdb';
import { models } from '@yourproject/postgresdb';

export const db = initialize({ models });
```

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
