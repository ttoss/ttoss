/* eslint-disable turbo/no-undeclared-env-vars */
import {
  type ModelCtor,
  Sequelize,
  type SequelizeOptions,
} from './sequelize-typescript';

let sequelize: Sequelize;

export type Options<Models> = Omit<SequelizeOptions, 'models' | 'dialect'> & {
  models: Models;
};

export const initialize = async <Models extends { [key: string]: ModelCtor }>({
  models,
  ...restOptions
}: Options<Models>): Promise<
  {
    sequelize: Sequelize;
  } & Models
> => {
  const username = process.env.DB_USERNAME,
    password = process.env.DB_PASSWORD,
    database = process.env.DB_NAME,
    host = process.env.DB_HOST,
    port = Number(process.env.DB_PORT) || 5432;

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

  if (username && password && database && host && port) {
    await sequelize.authenticate();
  }

  const close = sequelize.close;

  return { sequelize, close, ...models };
};
