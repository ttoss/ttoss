jest.mock('findup-sync', () => {
  return {
    __esModule: true,
    default: jest.fn().mockReturnValue('some/path'),
  };
});

jest.mock('fs', () => {
  return {
    readFileSync: jest.fn(),
  };
});

import { faker } from '@ttoss/test-utils/faker';
import { getPackageName } from './packageJson';
import { readFileSync } from 'fs';

const name = `@${faker.word.words()}/${faker.word.words()}`;

beforeAll(() => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (readFileSync as jest.Mock).mockReturnValue({
    toString: jest
      .fn()
      .mockReturnValue(`{ "name": "${name}", "version": "0.0.1" }`),
  });
});

test('should return package name', () => {
  expect(getPackageName()).toEqual(name);
});
