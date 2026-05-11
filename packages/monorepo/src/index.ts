import { Command } from 'commander';

import pkg from '../package.json';
import { setupMonorepo } from './setupMonorepo';
import { setupTests } from './setupTests';

const program = new Command();

program
  .name('ttoss-monorepo')
  .version(pkg.version)
  .description('Monorepo utilities for ttoss');

program
  .command('setup-monorepo [dir]')
  .description(
    'Setup monorepo configuration (ESLint, Prettier, Husky, commitlint, lint-staged, Lerna, Syncpack)'
  )
  .action((dir = '.') => {
    setupMonorepo({ dir });
  });

program
  .command('setup-tests [dir]')
  .description('Setup test structure following ttoss guidelines')
  .option('--e2e', 'Include e2e test setup', false)
  .action((dir = '.', options) => {
    setupTests({ dir, e2e: options.e2e });
  });

program.parse(process.argv);
