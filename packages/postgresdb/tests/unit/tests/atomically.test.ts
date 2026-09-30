import type { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import type { Sequelize } from 'sequelize';

import { atomically, initialize, models } from '../../models/dist';

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
  });

  sequelize = db.sequelize;

  await sequelize.sync();
});

afterAll(async () => {
  await sequelize.close();
  await postgresContainer.stop();
});

beforeEach(async () => {
  await models.User.destroy({ where: {}, truncate: true });
});

// The same id twice means both statements ran inside one transaction.
const currentTransactionId = async (): Promise<string> => {
  const [rows] = await sequelize.query('SELECT txid_current() AS id');

  return (rows as { id: string }[])[0].id;
};

test('commits every write when fn resolves', async () => {
  const result = await atomically({
    sequelize,
    fn: async () => {
      await models.User.create({ email: 'a@domain.com' });
      await models.User.create({ email: 'b@domain.com' });

      return 'done';
    },
  });

  expect(result).toBe('done');
  expect(await models.User.count()).toBe(2);
});

test('rolls back every write when fn throws', async () => {
  await expect(
    atomically({
      sequelize,
      fn: async () => {
        await models.User.create({ email: 'a@domain.com' });

        throw new Error('refused halfway');
      },
    })
  ).rejects.toThrow('refused halfway');

  expect(await models.User.count()).toBe(0);
});

test('runs every query inside fn in one transaction', async () => {
  const [first, second] = await atomically({
    sequelize,
    fn: async () => {
      return [await currentTransactionId(), await currentTransactionId()];
    },
  });

  expect(first).toBe(second);
});

test('leaves queries outside fn out of any transaction', async () => {
  await atomically({
    sequelize,
    fn: async () => {
      return undefined;
    },
  });

  expect(await currentTransactionId()).not.toBe(await currentTransactionId());
});

test('a nested call joins the open transaction', async () => {
  const ids = await atomically({
    sequelize,
    fn: async () => {
      const outer = await currentTransactionId();

      const inner = await atomically({
        sequelize,
        fn: currentTransactionId,
      });

      return { outer, inner };
    },
  });

  expect(ids.inner).toBe(ids.outer);
});

test('a nested call is rolled back with the outer one', async () => {
  await expect(
    atomically({
      sequelize,
      fn: async () => {
        await atomically({
          sequelize,
          fn: async () => {
            await models.User.create({ email: 'inner@domain.com' });
          },
        });

        throw new Error('outer refused');
      },
    })
  ).rejects.toThrow('outer refused');

  expect(await models.User.count()).toBe(0);
});

test('concurrent calls do not share a transaction', async () => {
  const [a, b] = await Promise.all([
    atomically({ sequelize, fn: currentTransactionId }),
    atomically({ sequelize, fn: currentTransactionId }),
  ]);

  expect(a).not.toBe(b);
});
