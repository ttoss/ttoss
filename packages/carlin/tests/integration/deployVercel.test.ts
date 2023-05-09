/* eslint-disable turbo/no-undeclared-env-vars */
import { parseCli } from '../../testUtils';

jest.mock('../../src/utils', () => {
  return {
    ...(jest.requireActual('../../src/utils') as any),
    spawn: jest.fn(),
  };
});

jest.mock('deepmerge', () => {
  return {
    all: jest.fn(),
  };
});

jest.mock('findup-sync', () => {
  return {
    __esModule: true,
    default: jest
      .fn()
      .mockReturnValueOnce('./some-dir')
      .mockReturnValueOnce(undefined),
  };
});

const realProcessExit = process.exit;

const originalEnv = process.env;

process.exit = jest.fn() as any;

import { cache, spawn } from '../../src/utils';

beforeEach(() => {
  /**
   * Cache clear to clear environment.
   */
  cache.clear();

  process.env = {
    ...originalEnv,
  };
});

afterEach(() => {
  process.env = originalEnv;
});

afterAll(() => {
  process.exit = realProcessExit;
});

const token = 'some-token';

test.each([
  {
    options: {},
  },
  {
    options: {
      environment: 'preview',
    },
  },
  {
    options: {
      environment: 'Staging',
    },
  },
  {
    options: {
      environment: 'Production',
    },
  },
])('should exit if token is not defined %#', async ({ options }) => {
  await parseCli(`deploy vercel`, options);
  expect(process.exit).toHaveBeenCalledTimes(1);
  expect(process.exit).toHaveBeenCalledWith(1);
});

test.each([
  {
    options: { token },
  },
  {
    options: {
      token,
      environment: 'preview',
    },
  },
  {
    options: {
      token,
      environment: 'Staging',
    },
  },
  {
    options: {},
    VERCEL_TOKEN: token,
  },
  {
    options: {
      environment: 'preview',
    },
    VERCEL_TOKEN: token,
  },
  {
    options: {
      environment: 'Staging',
    },
    VERCEL_TOKEN: token,
  },
])('should deploy preview %#', async ({ options, VERCEL_TOKEN }) => {
  if (VERCEL_TOKEN) {
    process.env.VERCEL_TOKEN = VERCEL_TOKEN;
  }

  await parseCli(`deploy vercel`, options);

  expect(spawn).toHaveBeenNthCalledWith(
    1,
    `vercel pull --yes --environment=preview --token=${token}`
  );

  expect(spawn).toHaveBeenNthCalledWith(2, `vercel build --token=${token}`);

  expect(spawn).toHaveBeenNthCalledWith(
    3,
    `vercel deploy --prebuilt --token=${token}`
  );
});

test.each([
  {
    options: {
      token,
      environment: 'Production',
    },
  },
  {
    options: {
      environment: 'Production',
    },
    VERCEL_TOKEN: token,
  },
])('should deploy production %#', async ({ options, VERCEL_TOKEN }) => {
  if (VERCEL_TOKEN) {
    process.env.VERCEL_TOKEN = VERCEL_TOKEN;
  }

  await parseCli(`deploy vercel`, options);

  expect(spawn).toHaveBeenNthCalledWith(
    1,
    `vercel pull --yes --environment=production --token=${token}`
  );

  expect(spawn).toHaveBeenNthCalledWith(
    2,
    `vercel build --prod --token=${token}`
  );

  expect(spawn).toHaveBeenNthCalledWith(
    3,
    `vercel deploy --prebuilt --prod --token=${token}`
  );
});
