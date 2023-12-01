import { CommandModule } from 'yargs';
import { generateEnv } from './generateEnv';

export const generateEnvCommand: CommandModule = {
  command: ['generate-env', 'ge', 'env'],
  describe: 'Generate environment files.',
  handler: generateEnv,
};
