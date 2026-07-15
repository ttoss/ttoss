import {
  type ModelCtor,
  Sequelize,
  type SequelizeOptions,
} from './sequelize-typescript';
import {
  syncWithAdvisoryLock,
  type SyncWithAdvisoryLockOptions,
} from './syncWithAdvisoryLock';

let sequelize: Sequelize;

export type Options<Models> = Omit<SequelizeOptions, 'models' | 'dialect'> & {
  models: Models;
  /**
   * If true, creates the pgvector extension in the database.
   * This is required to use VECTOR data types.
   * @default false
   */
  createVectorExtension?: boolean;
  /**
   * If provided, runs `sequelize.sync()` after connecting, serialized across
   * concurrently-starting instances with a Postgres session-level advisory
   * lock. Use this when multiple instances may boot at once (rolling deploys,
   * auto-scale-out) and each runs `sync()` against the same database.
   * @default undefined
   */
  syncLock?: Omit<SyncWithAdvisoryLockOptions, 'sequelize'>;
};

export const initialize = async <Models extends { [key: string]: ModelCtor }>({
  models,
  createVectorExtension = false,
  syncLock,
  ...restOptions
}: Options<Models>): Promise<
  {
    sequelize: Sequelize;
  } & Models
> => {
  const username = process.env.DATABASE_USER,
    password = process.env.DATABASE_PASSWORD,
    database = process.env.DATABASE_NAME,
    host = process.env.DATABASE_HOST,
    port = Number(process.env.DATABASE_PORT) || 5432;

  if (!sequelize) {
    sequelize = new Sequelize({
      logging: false,
      username,
      password,
      database,
      host,
      port,
      ...restOptions,
      define: {
        underscored: true,
        ...restOptions.define,
      },
      models: Object.values(models),
      /**
       * `options` cannot change the properties below.
       * They are fixed for the project.
       */
      dialect: 'postgres',
    });
  }

  const hasCredentials = [username, password, database, host, port].every(
    Boolean
  );

  if (hasCredentials) {
    await sequelize.authenticate();
  }

  // Create the pgvector extension
  if (createVectorExtension) {
    await sequelize.query('CREATE EXTENSION IF NOT EXISTS vector;');
  }

  // Run an advisory-locked schema sync when requested.
  if (syncLock) {
    await syncWithAdvisoryLock({ sequelize, ...syncLock });
  }

  const close = sequelize.close;

  return { sequelize, close, ...models };
};
