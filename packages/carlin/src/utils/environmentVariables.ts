const cache = new Map();

export { cache };

export type EnvironmentVariables =
  | 'BRANCH'
  | 'ENVIRONMENT'
  | 'PROJECT'
  | 'REGION'
  | 'STACK_NAME';

export const getEnvVar = (key: EnvironmentVariables) => {
  return cache.has(key) && cache.get(key) ? cache.get(key) : undefined;
};

export const setEnvVar = (key: EnvironmentVariables, value: any) => {
  return cache.set(key, value);
};
