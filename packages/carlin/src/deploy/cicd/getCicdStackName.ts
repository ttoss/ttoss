import { NAME } from '../../config';
import { getProjectName } from '../../utils/getProjectName';
import { pascalCase } from 'change-case';

export const getCicdStackName = () => {
  const project = getProjectName();
  return pascalCase([NAME, 'Cicd', project].join(' '));
};
