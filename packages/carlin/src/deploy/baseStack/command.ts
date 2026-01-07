import { Command } from 'commander';

import { deployBaseStack } from './deployBaseStack';

export const deployBaseStackCommand = new Command('base-stack')
  .description('Create base resources.')
  .action(async function () {
    await deployBaseStack();
  });
