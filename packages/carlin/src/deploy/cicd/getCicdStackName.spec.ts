import { faker } from '@ttoss/test-utils/faker';
import { pascalCase } from 'change-case';

import { getProjectName } from './../../utils/getProjectName';
import { getCicdStackName } from './getCicdStackName';

jest.mock('../../utils/getProjectName', () => {
  return {
    getProjectName: jest.fn(),
  };
});

test('stack name should contain project name', () => {
  const projectName = faker.word.words();
  (getProjectName as jest.Mock).mockReturnValue(projectName);
  expect(getCicdStackName()).toContain(pascalCase(projectName));
});
