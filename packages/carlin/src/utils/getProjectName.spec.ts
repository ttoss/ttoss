jest.mock('./packageJson');

import { cache } from './environmentVariables';
import { faker } from '@ttoss/test-utils/faker';
import { getPackageName } from './packageJson';
import { getProjectName } from './getProjectName';
import { pascalCase } from 'change-case';

afterEach(() => {
  cache.delete('PROJECT');
});

test('should return project name defined on cache', () => {
  const projectName = faker.random.word();
  cache.set('PROJECT', projectName);
  expect(getProjectName()).toEqual(projectName);
});

test('should return the scope of the package name', () => {
  const scope = `${faker.random.word()}`;
  (getPackageName as jest.Mock).mockReturnValue(
    `@${scope}/${faker.random.word()}`
  );
  expect(getProjectName()).toEqual(pascalCase(scope));
});

test('should return the package name', () => {
  const packageName = `${faker.random.word()}`;
  (getPackageName as jest.Mock).mockReturnValue(packageName);
  expect(getProjectName()).toEqual(pascalCase(packageName));
});
