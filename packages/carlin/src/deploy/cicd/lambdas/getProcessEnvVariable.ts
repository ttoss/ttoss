export const getProcessEnvVariable = (env: string): string => {
  if (process.env[env]) {
    return process.env[env] as string;
  }

  throw new Error(`process.env.${env} is not defined.`);
};
