const { log, warn, error } = console;

export const logger = {
  warn: (value) => {
    if (import.meta.env.DEV) {
      warn(value);
    }
  },
  info: (value) => {
    if (import.meta.env.DEV) {
      log(value);
    }
  },
  error: (value) => {
    error(value);
  },
};
