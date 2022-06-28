import { getEnvVar } from './environmentVariables';

export const getEnvironment = (): string | undefined =>
  getEnvVar('ENVIRONMENT');
