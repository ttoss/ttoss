const { log, warn, error } = console;

export const Logger = (isDev: boolean) => {
  return (prefix: string) => {
    return {
      warn: (value: string) => {
        if (isDev) {
          const now = new Date();
          warn(`[${now}] - ${prefix} - ${value}`);
        }
      },
      info: (value: string) => {
        if (isDev) {
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
