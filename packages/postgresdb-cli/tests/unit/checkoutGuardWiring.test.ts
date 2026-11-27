import * as readline from 'node:readline';

import { checkCheckout } from 'src/checkCheckout';
import { getDbDynamically } from 'src/getDbDynamically';
import { loadModuleDynamically } from 'src/loadModuleDynamically';
import { migrate } from 'src/migrate';
import { sync } from 'src/sync';

jest.mock('src/checkCheckout');
jest.mock('src/getDbDynamically');
jest.mock('src/loadModuleDynamically');
jest.mock('node:readline');

const answer = (text: string) => {
  jest.mocked(readline.createInterface).mockReturnValue({
    question: (_query: string, callback: (answer: string) => void) => {
      return callback(text);
    },
    close: jest.fn(),
  } as never);
};

const REFUSED = 'DATABASE_GIT_BRANCH is "main" for Production, but ...';

beforeEach(() => {
  jest.spyOn(console, 'info').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.mocked(loadModuleDynamically).mockResolvedValue({});
});

afterEach(() => {
  process.exitCode = undefined;
  jest.restoreAllMocks();
});

test('sync --alter stops before connecting when the checkout is refused', async () => {
  jest.mocked(checkCheckout).mockReturnValue(REFUSED);

  await sync({ alter: true, dbPath: 'src/db.ts', environment: 'Production' });

  expect(checkCheckout).toHaveBeenCalledWith({ environment: 'Production' });
  // eslint-disable-next-line no-console
  expect(console.error).toHaveBeenCalledWith(REFUSED);
  expect(getDbDynamically).not.toHaveBeenCalled();
  expect(process.exitCode).toBe(1);
});

test('sync --alter asks for confirmation once the checkout passes', async () => {
  jest.mocked(checkCheckout).mockReturnValue(undefined);
  answer('yes');
  const syncSchema = jest.fn();
  jest.mocked(getDbDynamically).mockResolvedValue({
    sequelize: { sync: syncSchema, close: jest.fn() },
  } as never);

  await sync({ alter: true, dbPath: 'src/db.ts', environment: 'Production' });

  expect(syncSchema).toHaveBeenCalledWith({ force: false, alter: true });
});

test('sync --alter exits when the operator does not confirm', async () => {
  jest.mocked(checkCheckout).mockReturnValue(undefined);
  answer('no');
  const exit = jest.spyOn(process, 'exit').mockImplementation(() => {
    throw new Error('exit');
  });

  await expect(
    sync({ alter: true, dbPath: 'src/db.ts', environment: 'Production' })
  ).rejects.toThrow('exit');

  expect(exit).toHaveBeenCalledWith(0);
  expect(getDbDynamically).not.toHaveBeenCalled();
});

test('sync without --alter does not check the checkout', async () => {
  const close = jest.fn();
  jest
    .mocked(getDbDynamically)
    .mockResolvedValue({ sequelize: { sync: jest.fn(), close } } as never);

  await sync({ alter: false, dbPath: 'src/db.ts', environment: 'Production' });

  expect(checkCheckout).not.toHaveBeenCalled();
  expect(close).toHaveBeenCalled();
});

test.each([[['run']], [['run', 'add-column']], [['baseline', '--all']]])(
  'migrate %j stops before loading migrations when the checkout is refused',
  async (args) => {
    jest.mocked(checkCheckout).mockReturnValue(REFUSED);

    await migrate(args, {
      environment: 'Production',
      migrationsPath: 'src/migrations.ts',
    });

    expect(checkCheckout).toHaveBeenCalledWith({ environment: 'Production' });
    expect(loadModuleDynamically).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  }
);

test.each([[['status']], [['run', '--dry-run']], [['help']]])(
  'migrate %j does not check the checkout',
  async (args) => {
    await migrate(args, {
      environment: 'Production',
      migrationsPath: 'src/migrations.ts',
    });

    expect(checkCheckout).not.toHaveBeenCalled();
    expect(loadModuleDynamically).toHaveBeenCalled();
  }
);

test('migrate exits 2 when the file exports no migrations', async () => {
  await migrate(['status'], {
    environment: 'Production',
    migrationsPath: 'src/migrations.ts',
  });

  expect(process.exitCode).toBe(2);
});
