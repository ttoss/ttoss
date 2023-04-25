const { log, warn, error } = console;
const isDev: boolean =
  (import.meta as any)?.env?.DEV || (process.env as any)?.DEV === 'true';

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
