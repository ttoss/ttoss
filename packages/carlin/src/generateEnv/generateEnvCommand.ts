import { Command } from 'commander';
import { generateEnv } from './generateEnv';

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

export const generateEnvCommand = new Command('generate-env')
  .description('Generate environment files.')
  .aliases(['ge', 'env'])
  .option(
    '-d, --default-environment <environment>',
    options['default-environment'].describe,
    options['default-environment'].default
  )
  .option('-p, --path <path>', options.path.describe, options.path.default)
  .action(async function (this: Command) {
    const opts = this.opts();
    await generateEnv({
      defaultEnvironment: opts.defaultEnvironment,
      path: opts.path,
    });
  });
