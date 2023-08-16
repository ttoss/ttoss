/* eslint-disable no-var */
import * as fs from 'fs';
import { faker } from '@ttoss/test-utils/faker';
import { parseCli } from '../../../testUtils';

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

test('should read from .env if environment is not production', async () => {
  const content = faker.word.words(10);

  (fs.promises.readFile as jest.Mock).mockImplementationOnce(
    async (path: string) => {
      if (path.includes('/.env')) {
        return content;
      }

      return undefined;
    }
  );

  await parseCli('generate-env', {});

  expect(fs.promises.writeFile).toHaveBeenCalledWith(
    expect.stringContaining('/.env.local'),
    content
  );
});

test.each([['Development'], ['Test'], ['Staging'], ['Production']])(
  'should read from .env.Environment if environment is defined',
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
      expect.stringContaining('/.env.local'),
      content
    );
  }
);

test("should not write if .env file don't exists", async () => {
  (fs.promises.readFile as jest.Mock).mockResolvedValueOnce(undefined);

  await parseCli('generate-env', {});

  expect(fs.promises.writeFile).not.toHaveBeenCalled();
});
