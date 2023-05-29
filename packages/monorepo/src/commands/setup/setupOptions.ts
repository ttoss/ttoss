import { InferredOptionTypes } from 'yargs';

export const setupOptions = {
  cicd: {
    describe: 'Configure CI/CD',
    require: false,
  },
  force: {
    default: false,
    describe: 'Force setup even if already setup',
    require: false,
    type: 'boolean',
  },
  syncpack: {
    default: true,
    describe: 'Configure Syncpack to manage your dependencies',
    require: false,
    type: 'boolean',
  },
  ttoss: {
    default: false,
    describe: 'Is ttoss monorepo?',
    require: false,
    type: 'boolean',
  },
} as const;

export const cicdOptions = {
  pr: {
    default: true,
    describe: 'Configure CI/CD',
    require: false,
    type: 'boolean',
  },
  main: {
    default: false,
    describe: 'Force setup even if already setup',
    require: false,
    type: 'boolean',
  },
} as const;

export type SetupOptions = InferredOptionTypes<typeof setupOptions> & {
  cicd: InferredOptionTypes<typeof cicdOptions>;
};
