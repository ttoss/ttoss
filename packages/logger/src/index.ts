const { log, warn, error } = console;

const nodeEnv = process?.env as any;
const browserEnv = (import.meta as any)?.env;

const isDev: boolean = browserEnv?.DEV === 'true' || nodeEnv?.DEV === 'true';

export const Logger = (prefix: string) => {
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
