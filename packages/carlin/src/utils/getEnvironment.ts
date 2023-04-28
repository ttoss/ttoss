import { getEnvVar } from './environmentVariables';

export const getEnvironment = (): string | undefined => {
  return getEnvVar('ENVIRONMENT');
};
