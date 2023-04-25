const { log, warn, error } = console;

export const Logger = (isDev?: boolean) => {
  let devEnv = true;

  if (isDev === undefined) {
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    const node_env = process?.env?.NODE_ENV;
    if (node_env === 'production') devEnv = false;
  } else devEnv = isDev;

  return (prefix: string) => {
    return {
      warn: (value: string) => {
        if (devEnv) {
          const now = new Date();
          warn(`[${now}] - ${prefix} - ${value}`);
        }
      },
      info: (value: string) => {
        if (devEnv) {
          const now = new Date();
          log(`[${now}] - ${prefix} - ${value}`);
        }
      },
      error: (value: string) => {
        const now = new Date();
        error(`[${now}] - ${prefix} - ${value}`);
      },
    };
  };
};
