import type { CommandModule, InferredOptionTypes } from 'yargs';

import { type DeployOutput, generateEnv } from './generateEnv';

export const DEFAULT_ENVIRONMENT = 'Staging';

export const options = {
  'default-environment': {
    alias: 'd',
    type: 'string',
    describe: 'Default environment.',
    default: DEFAULT_ENVIRONMENT,
  },
  path: {
    alias: 'p',
    type: 'string',
    describe: 'Path to the directory where envs files are located.',
    default: './',
  },
} as const;

export const generateEnvCommand: CommandModule<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any,
  InferredOptionTypes<typeof options> & {
    envFromDeployOutputs?: DeployOutput[] | null;
  }
> = {
  command: ['generate-env', 'ge', 'env'],
  describe: 'Generate environment files.',
  builder: (yargs) => {
    return yargs.options(options);
  },
  handler: (args) => {
    return generateEnv(args);
  },
};
