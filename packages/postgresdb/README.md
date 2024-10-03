# @ttoss/postgresdb

This package uses [Sequelize](https://sequelize.org/) to provide a simple framework for working with PostgreSQL databases.

## Installation

```bash
pnpm add @ttoss/postgresdb
pnpm add -D @ttoss/postgresdb-cli
```

## Usage

### Setup the database

If you already have a database, you can skip this step. If you don't, you can use the following Docker command to create a new PostgreSQL database on port 5432 using Docker:

```bash
docker run --name postgres-test -e POSTGRES_PASSWORD=mysecretpassword -d -p 5432:5432 postgres
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

export const db = initialize({ models });
```

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

### Sync the database schema

To [sync](https://sequelize.org/docs/v6/core-concepts/model-basics/#model-synchronization) the database schema with the models, use the [`sync` command](../postgresdb-cli/):

```bash
pnpm dlx @ttoss/postgresdb-cli sync
```

By now, you should have a working database with a `User` table.

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
