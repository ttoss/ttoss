import { faker } from '@ttoss/test-utils/faker';
import { getProjectName } from './../../utils/getProjectName';
import { pascalCase } from 'change-case';

jest.mock('../../utils/getProjectName', () => {
  return {
    getProjectName: jest.fn(),
  };
});

import { getCicdStackName } from './getCicdStackName';

test('stack name should contain project name', () => {
  const projectName = faker.word.words();
  (getProjectName as jest.Mock).mockReturnValue(projectName);
  expect(getCicdStackName()).toContain(pascalCase(projectName));
});
