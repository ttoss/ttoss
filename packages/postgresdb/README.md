# @ttoss/postgresdb

This package uses [Sequelize](https://sequelize.org/) to provide a simple framework for working with PostgreSQL databases.

## Installation

```bash
pnpm add @ttoss/postgresdb
pnpm add -D @ttoss/postgresdb-cli
```

### ESM only

This package is [ESM only](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c). Make sure to use it in an ESM environment.

```json
{
  "type": "module"
}
```

## Usage

### Setup the database

If you already have a database, you can skip this step. If you don't, you can use the following Docker command to create a new PostgreSQL database on port 5432 using Docker:

```bash
docker run --name postgres-test -e POSTGRES_PASSWORD=mysecretpassword -d -p 5432:5432 postgres
```

If you want to use [Docker Compose](https://docs.docker.com/compose/), you can create a `docker-compose.yml` file with the following content:

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

And run the following command:

```bash
docker compose up -d
```

### Create a model

Create a folder called `models` and add a new file called `User.ts` with the following content:

```typescript
import { Table, Column, Model } from '@ttoss/postgresdb';

@Table
export class User extends Model<User> {
  @Column
  declare name: string;

  @Column
  declare email: string;
}

_This packages exports all decorators from [sequelize-typescript](https://github.com/sequelize/sequelize-typescript), so you can use them to define your models._
```

Export the model in the `models/index.ts` file:

```typescript
export { User } from './User';
```

### Create a new instance of the database

Create a new file called `src/db.ts` with the following content:

```typescript
import { initialize } from '@ttoss/postgresdb';
import * as models from './models';

export const db = await initialize({ models });
```

_Note: the script [`sync`](#sync-the-database-schema) will use the `db` object to sync the database schema with the models._

### Environment variables

You can set the database connection parameters in two ways:

1. Defining them in the `src/db.ts` file using the `initialize` function.

   ```typescript
   export const db = initialize({
     database: '', // database name
     username: '', // database username
     password: '', // database password
     host: '', // database host
     port: 5432, // database port. Default: 5432
     models,
   });
   ```

2. Using environment variables:

   - `DB_NAME`: database name
   - `DB_USERNAME`: database username
   - `DB_PASSWORD`: database password
   - `DB_HOST`: database host
   - `DB_PORT`: database port. Default: 5432

   `@ttoss/postgresdb` will use them automatically if they are defined.

   Here is an example of a `.env` file:

   ```env
   DB_NAME=postgres
   DB_USERNAME=postgres
   DB_PASSWORD=mysecretpassword
   DB_HOST=localhost
   DB_PORT=5432
   ```

### Sync the database schema

To [sync](https://sequelize.org/docs/v6/core-concepts/model-basics/#model-synchronization) the database schema with the models, use the [`sync` command](../postgresdb-cli/):

```bash
pnpm dlx @ttoss/postgresdb-cli sync
```

By now, you should have a working database with a `User` table.

This command works by importing the `db` object from the `src/db.ts` file and calling the `sync` method on it.

### CRUD operations

You can now use the `db` object to interact with the database. Check the [Sequelize documentation](https://sequelize.org/master/manual/model-querying-basics.html) for more information.

```typescript
import { db } from './db';

const user = await db.User.create({
  name: 'John Doe',
  email: 'johndoe@email.com',
});
```

All models are available in the `db` object.

### Using in a monorepo

If you want to use in a monorepo by sharing the models between packages, you need to create some configurations to make it work.

#### On the `postgresdb` package

1. Create your `postgresdb` package following the steps above.

1. Exports your main file in the `package.json` file:

   ```json
   {
     "type": "module",
     "exports": "./src/index.ts"
   }
   ```

1. Create a new file called `src/index.ts` with the following content to exports the `models` you've created:

   ```typescript
   export * as models from './models';
   ```

   _We recommend to not export the `db` object in this file because you may want to use different configurations in different packages._

#### On the other packages

1. Install `@ttoss/postgresdb` package:

   ```bash
   pnpm add @ttoss/postgresdb
   ```

1. Add your `postgresdb` package as a dependency. In the case you're using PNPM, you can use the [workspace protocol](https://pnpm.io/workspaces#workspace-protocol-workspace):

   ```json
   {
     "dependencies": {
       "@yourproject/postgresdb": "workspace:^"
     }
   }
   ```

1. Include the `postgresdb` package in the `include` field of the `tsconfig.json` file:

   ```json
   {
     "include": ["src", "../postgresdb/src"]
   }
   ```

   _This way, you can import the models using the `@yourproject/postgresdb` package._

1. Create a new file called `src/db.ts` with the following content:

   ```typescript
   import { initialize } from '@ttoss/postgresdb';
   import { models } from '@yourproject/postgresdb';

   export const db = initialize({
     models,
     // other configurations
   });
   ```

1. Use the `db` object to interact with the database.

## API

### `initialize(options: InitializeOptions): db`

Initialize the database connection and load the models.

#### Options

All [Sequelize options](https://sequelize.org/api/v6/class/src/sequelize.js~sequelize#instance-constructor-constructor) are available, expect `models`.

- `models`: An object with all models to be loaded. The keys are the model names, and the values are the model classes. This way, you can access the models using the `db` object.

### Sequelize decorators

This package exports all decorators from [sequelize-typescript](https://www.npmjs.com/package/sequelize-typescript), i.e., `@Table`, `@Column`, `@ForeignKey`, etc.

## Types

### `ModelColumns<T>`

A type that represents the columns of a model.

```typescript
import { Column, Model, type ModelColumns, Table } from '@ttoss/postgresdb';

@Table
class User extends Model<User> {
  @Column
  declare name?: string;

  @Column
  declare email: string;
}

/**
 * UserColumns = {
 *  name?: string;
 *  email: string;
 * }
 */
type UserColumns = ModelColumns<User>;
```
