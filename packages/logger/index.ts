const { log, warn, error } = console;
const isDev: boolean = (import.meta as any).env.DEV;

export const logger = {
  warn: (value: string) => {
    if (isDev) {
      warn(value);
    }
  },
  info: (value: string) => {
    if (isDev) {
      log(value);
    }
  },
  error: (value: string) => {
    error(value);
  },
};
