import { Command } from 'commander';

import pkg from '../package.json';
import { setupTests } from './setupTests';

const program = new Command();

program
  .name('ttoss-monorepo')
  .version(pkg.version)
  .description('Monorepo utilities for ttoss');

program
  .command('setup-tests [dir]')
  .description('Setup test structure following ttoss guidelines')
  .option('--e2e', 'Include e2e test setup', false)
  .action((dir = '.', options) => {
    setupTests({ dir, e2e: options.e2e });
  });

program.parse(process.argv);
