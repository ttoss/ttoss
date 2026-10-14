import { pascalCase } from 'change-case';

import { NAME } from '../../config';
import { getProjectName } from '../../utils/getProjectName';

export const getCicdStackName = () => {
  const project = getProjectName();
  return pascalCase([NAME, 'Cicd', project].join(' '));
};
