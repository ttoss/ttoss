import {
  EnvironmentVariables,
  cache,
  getEnvVar,
  setEnvVar,
} from './environmentVariables';
import { faker } from '@ttoss/test-utils/faker';

test('basic cache routines', () => {
  const key = faker.random.word();
  const value = faker.random.word();

  expect(cache.has(key)).toBeFalsy();

  cache.set(key, value);

  expect(cache.has(key)).toBeTruthy();
  expect(cache.get(key)).toEqual(value);
});

test.each(
  (
    [
      'BRANCH',
      'ENVIRONMENT',
      'PROJECT',
      'REGION',
      'STACK_NAME',
    ] as EnvironmentVariables[]
  ).map((env) => {
    return [env];
  })
)('%s', (key) => {
  const value = faker.random.word();

  expect(cache.has(key)).toBeFalsy();

  setEnvVar(key, value);

  expect(cache.has(key)).toBeTruthy();
  expect(getEnvVar(key)).toEqual(value);
});
