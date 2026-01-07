import type { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import type { Sequelize } from '@ttoss/postgresdb';
import { initialize } from '@ttoss/postgresdb';
import { models } from 'dist/index';

let sequelize: Sequelize;

jest.setTimeout(60000);

let postgresContainer: StartedPostgreSqlContainer;

beforeAll(async () => {
  postgresContainer = await new PostgreSqlContainer('postgres:17').start();

  const db = await initialize({
    models,
    logging: false,
    username: postgresContainer.getUsername(),
    password: postgresContainer.getPassword(),
    database: postgresContainer.getDatabase(),
    host: postgresContainer.getHost(),
    port: postgresContainer.getPort(),
    define: {
      underscored: true,
    },
  });

  sequelize = db.sequelize;

  await sequelize.sync();
});

afterAll(async () => {
  await sequelize.close();
  await postgresContainer.stop();
});

describe('Database models', () => {
  const User = models.User;
  const userData = {
    email: 'test@example.com',
  };
  let userId: number;

  const Farm = models.Farm;
  const farmData = {
    name: 'Test Farm',
    user_id: 0, // to be set in test
  };
  let farmId: number;

  describe('User model', () => {
    test('table name should be users', () => {
      expect(User.getTableName()).toBe('users');
    });

    test('should create and retrieve User', async () => {
      const user = await User.create(userData);
      userId = user.id;

      const foundUser = await User.findByPk(userId);
      expect(foundUser).toMatchObject(userData);
    });
  });

  describe('Farm model', () => {
    test('table name should be farms', () => {
      expect(Farm.getTableName()).toBe('farms');
    });

    test('should create and retrieve Farm', async () => {
      farmData.user_id = userId;
      const farm = await Farm.create(farmData);
      farmId = farm.id;

      const foundFarm = await Farm.findByPk(farmId);
      expect(foundFarm).toMatchObject(farmData);
    });
  });
});
