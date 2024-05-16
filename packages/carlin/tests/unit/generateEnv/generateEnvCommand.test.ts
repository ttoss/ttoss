/* eslint-disable no-var */
import * as fs from 'fs';
import { DEFAULT_ENVIRONMENT } from '../../../src/generateEnv/generateEnvCommand';
import { faker } from '@ttoss/test-utils/faker';
import { parseCli } from '../../testUtils';

jest.mock('findup-sync', () => {
  return {
    __esModule: true,
    default: jest
      .fn()
      .mockReturnValueOnce('./some-dir')
      .mockReturnValueOnce(undefined),
  };
});

jest.mock('fs', () => {
  return {
    ...jest.requireActual('fs'),
    promises: {
      ...jest.requireActual('fs').promises,
      readFile: jest.fn(),
      writeFile: jest.fn(),
    },
  };
});

beforeEach(() => {
  jest.clearAllMocks();
});

test('should read from .env.DEFAULT_ENVIRONMENT if environment is not defined', async () => {
  const content = faker.word.words(10);

  (fs.promises.readFile as jest.Mock).mockImplementationOnce(
    async (path: string) => {
      if (path.includes(`/.env.${DEFAULT_ENVIRONMENT}`)) {
        return content;
      }

      return undefined;
    }
  );

  await parseCli('generate-env', { environment: undefined });

  expect(fs.promises.writeFile).toHaveBeenCalledWith(
    expect.stringContaining('/.env'),
    content
  );
});

test.each([['Development'], ['Staging'], ['Production']])(
  'should read from .env.Environment if environment is defined - %s',
  async (environment) => {
    const content = faker.word.words(10);

    (fs.promises.readFile as jest.Mock).mockImplementationOnce(
      async (path: string) => {
        if (path.includes(`/.env.${environment}`)) {
          return content;
        }

        return undefined;
      }
    );

    await parseCli('generate-env', { environment });

    expect(fs.promises.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('/.env'),
      content
    );
  }
);

test("should not write if .env file don't exists", async () => {
  (fs.promises.readFile as jest.Mock).mockResolvedValueOnce(undefined);

  await parseCli('generate-env', {});

  expect(fs.promises.writeFile).not.toHaveBeenCalled();
});

test('should read envs from path', async () => {
  const content = faker.word.words(10);

  const envsPath = 'some-dir';

  (fs.promises.readFile as jest.Mock).mockImplementationOnce(
    async (path: string) => {
      if (path.includes(`/${envsPath}/.env.Staging`)) {
        return content;
      }

      return undefined;
    }
  );

  await parseCli('generate-env', { path: envsPath, environment: 'Staging' });

  expect(fs.promises.writeFile).toHaveBeenCalledWith(
    expect.stringContaining('/.env'),
    content
  );
});
