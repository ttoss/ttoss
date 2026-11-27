import type { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { DataType, Sequelize } from '@ttoss/postgresdb';
import { drift } from 'src/drift';
import { getDbDynamically } from 'src/getDbDynamically';

jest.mock('src/getDbDynamically');

jest.setTimeout(120000);

let postgresContainer: StartedPostgreSqlContainer;

const connect = () => {
  return new Sequelize({
    dialect: 'postgres',
    logging: false,
    username: postgresContainer.getUsername(),
    password: postgresContainer.getPassword(),
    database: postgresContainer.getDatabase(),
    host: postgresContainer.getHost(),
    port: postgresContainer.getPort(),
    define: { underscored: true },
  });
};

/**
 * Runs `drift` against `sequelize`, as the CLI would after loading the
 * project's `db`, and returns what it printed and its exit code.
 */
const runDrift = async ({ sequelize }: { sequelize: Sequelize }) => {
  jest.mocked(getDbDynamically).mockResolvedValue({ sequelize } as never);
  const info = jest.spyOn(console, 'info').mockImplementation(() => {});

  await drift({ dbPath: 'src/db.ts', environment: 'Test' });

  const output = info.mock.calls.map(([format, ...args]) => {
    return args.reduce<string>((line, arg) => {
      return line.replace('%s', String(arg));
    }, String(format));
  });
  info.mockRestore();

  return { output, exitCode: process.exitCode };
};

const ADDS = 'In the models, not in the database (sync adds):';
const DROPS = 'In the database, not in the models (sync --alter drops):';

beforeAll(async () => {
  postgresContainer = await new PostgreSqlContainer(
    'pgvector/pgvector:0.8.1-pg18-trixie'
  )
    .withPassword('drift-secret-password')
    .start();

  const sequelize = connect();
  await sequelize.query(
    'CREATE TABLE widgets (id SERIAL PRIMARY KEY, name TEXT, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ)'
  );
  await sequelize.query(
    'CREATE TABLE legacy_widgets (id SERIAL PRIMARY KEY, name TEXT, old_code TEXT, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ)'
  );
  await sequelize.close();
});

afterEach(() => {
  process.exitCode = undefined;
});

afterAll(async () => {
  await postgresContainer.stop();
});

test('no drift prints none on both lines and exits 0', async () => {
  const sequelize = connect();
  // With a schema, getTableName returns `{ tableName, schema }`.
  sequelize.define(
    'widgets',
    { name: DataType.TEXT },
    { tableName: 'widgets', schema: 'public' }
  );

  const { output, exitCode } = await runDrift({ sequelize });

  expect(output).toEqual([
    `Database: ${postgresContainer.getDatabase()} (user: ${postgresContainer.getUsername()})`,
    `${ADDS} none`,
    `${DROPS} none`,
  ]);
  expect(exitCode).toBe(0);
});

test('a column the models lack goes under drops and exits 1', async () => {
  const sequelize = connect();
  sequelize.define(
    'legacyWidgets',
    { name: DataType.TEXT },
    { tableName: 'legacy_widgets' }
  );

  const { output, exitCode } = await runDrift({ sequelize });

  expect(output).toContain(`${ADDS} none`);
  expect(output).toContain(`${DROPS} legacy_widgets.old_code`);
  expect(exitCode).toBe(1);
});

test('a new model field and a new model go under adds', async () => {
  const sequelize = connect();
  sequelize.define(
    'widgets',
    { name: DataType.TEXT, colorCode: DataType.TEXT },
    { tableName: 'widgets' }
  );
  sequelize.define(
    'gadgets',
    { name: DataType.TEXT },
    { tableName: 'gadgets' }
  );

  const { output, exitCode } = await runDrift({ sequelize });

  expect(output).toContain(`${ADDS} widgets.color_code, gadgets (table)`);
  expect(output).toContain(`${DROPS} none`);
  expect(exitCode).toBe(0);
});

test('never prints the password and closes the connection', async () => {
  const sequelize = connect();
  const close = jest.spyOn(sequelize, 'close');

  const { output } = await runDrift({ sequelize });

  expect(output.join('\n')).not.toContain(postgresContainer.getPassword());
  expect(close).toHaveBeenCalled();
});
