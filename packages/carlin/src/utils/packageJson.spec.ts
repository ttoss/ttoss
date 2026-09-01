import { readFileSync } from 'node:fs';

import { faker } from '@ttoss/test-utils/faker';

import { getPackageName } from './packageJson';

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

const name = `@${faker.word.words()}/${faker.word.words()}`;

beforeAll(() => {
  (readFileSync as jest.Mock).mockReturnValue({
    toString: jest
      .fn()
      .mockReturnValue(`{ "name": "${name}", "version": "0.0.1" }`),
  });
});

test('should return package name', () => {
  expect(getPackageName()).toEqual(name);
});
