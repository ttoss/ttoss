jest.mock('find-up', () => ({
  sync: jest.fn().mockReturnValue('some/path'),
}));

jest.mock('fs', () => ({
  readFileSync: jest.fn(),
}));

import { faker } from '@ttoss/test-utils/faker';
import { getPackageName } from './packageJson';
import { readFileSync } from 'fs';

const name = `@${faker.random.word()}/${faker.random.word()}`;

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
