import type { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import type { Sequelize } from 'sequelize';
import { Op } from 'sequelize';

import { initialize, models } from '../../models/dist';

jest.setTimeout(60000);

let sequelize: Sequelize;
let postgresContainer: StartedPostgreSqlContainer;

beforeAll(async () => {
  postgresContainer = await new PostgreSqlContainer(
    'pgvector/pgvector:0.8.1-pg18-trixie'
  ).start();

  const db = await initialize({
    models,
    logging: false,
    username: postgresContainer.getUsername(),
    password: postgresContainer.getPassword(),
    database: postgresContainer.getDatabase(),
    host: postgresContainer.getHost(),
    port: postgresContainer.getPort(),
    createVectorExtension: true,
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

test('should create and retrieve User', async () => {
  const userData = {
    email: 'some@domain.com',
    name: 'Some Name',
  };

  const user = await models.User.create(userData);
  const userId = user.id;

  const foundUser = await models.User.findByPk(userId);
  expect(foundUser).toMatchObject(userData);
});

test('should create and retrieve User with VECTOR embedding', async () => {
  const userData = {
    email: 'vector@domain.com',
    name: 'Vector User',
    embedding: [1.5, 2.5, 3.5],
  };

  const user = await models.User.create(userData);
  const userId = user.id;

  const foundUser = await models.User.findByPk(userId);
  expect(foundUser?.email).toBe(userData.email);
  expect(foundUser?.name).toBe(userData.name);
  // pgvector returns vectors as strings in the format "[1.5,2.5,3.5]"
  expect(foundUser?.embedding).toBe('[1.5,2.5,3.5]');
});

test('should handle VECTOR operations', async () => {
  // Create users with different embeddings
  const user1 = await models.User.create({
    email: 'user1@domain.com',
    name: 'User 1',
    embedding: [1.0, 0.0, 0.0],
  });

  const user2 = await models.User.create({
    email: 'user2@domain.com',
    name: 'User 2',
    embedding: [0.0, 1.0, 0.0],
  });

  const user3 = await models.User.create({
    email: 'user3@domain.com',
    name: 'User 3',
    embedding: [1.0, 1.0, 0.0],
  });

  // Verify all users were created with correct embeddings
  // pgvector returns vectors as strings
  expect(user1.embedding).toBe('[1,0,0]');
  expect(user2.embedding).toBe('[0,1,0]');
  expect(user3.embedding).toBe('[1,1,0]');

  // Test finding users with vectors
  const allUsers = await models.User.findAll({
    where: {
      email: {
        [Op.in]: ['user1@domain.com', 'user2@domain.com', 'user3@domain.com'],
      },
    },
  });

  expect(allUsers).toHaveLength(3);
  expect(
    allUsers.some((u) => {
      return u.email === 'user1@domain.com';
    })
  ).toBe(true);
  expect(
    allUsers.some((u) => {
      return u.email === 'user2@domain.com';
    })
  ).toBe(true);
  expect(
    allUsers.some((u) => {
      return u.email === 'user3@domain.com';
    })
  ).toBe(true);
});
