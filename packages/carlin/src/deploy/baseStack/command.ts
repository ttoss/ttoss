import { CommandModule } from 'yargs';
import { deployBaseStack } from './deployBaseStack';

export const deployBaseStackCommand: CommandModule = {
  command: 'base-stack',
  describe: 'Create base resources.',
  handler: deployBaseStack,
};
