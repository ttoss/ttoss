const cache = new Map();

export { cache };

export type EnvironmentVariables =
  'BRANCH' | 'ENVIRONMENT' | 'PROJECT' | 'REGION' | 'ROLE_ARN' | 'STACK_NAME';

export const getEnvVar = (key: EnvironmentVariables) => {
  return cache.has(key) && cache.get(key) ? cache.get(key) : undefined;
};

export const setEnvVar = (key: EnvironmentVariables, value: unknown) => {
  if (!value) {
    return cache.delete(key);
  }

  return cache.set(key, value);
};
