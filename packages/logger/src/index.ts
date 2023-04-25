const { log, warn, error } = console;
const isDev: boolean = (import.meta as any).env.DEV || (process.env as any).DEV;

export const Logger = (prefix: string) => {
  return {
    warn: (value: string) => {
      if (isDev) {
        const now = Date.now();
        warn(`[${now}] - ${prefix} - ${value}`);
      }
    },
    info: (value: string) => {
      if (isDev) {
        const now = Date.now();
        log(`[${now}] - ${prefix} - ${value}`);
      }
    },
    error: (value: string) => {
      const now = Date.now();
      error(`[${now}] - ${prefix} - ${value}`);
    },
  };
};
