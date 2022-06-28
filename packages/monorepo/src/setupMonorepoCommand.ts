import { CommandModule } from 'yargs';
import { spawn } from './spawn';
import fs from 'fs';
import log from 'npmlog';

const logPrefix = '@ttoss/monorepo';

const executeCommands = async () => {
  spawn('rm', ['.husky/pre-commit']);
  spawn('npx', [
    'husky',
    'add',
    '.husky/pre-commit',
    'yarn lint-staged -c node_modules/@ttoss/monorepo/config/lintstagedrc.js',
  ]);
  spawn('yarn', ['husky', 'install']);
};

const writeFiles = async () => {
  const eslintrc = `module.exports = {\n  extends: '@ttoss/eslint-config',\n};`;
  fs.writeFileSync('.eslintrc.js', eslintrc);
  // Lerna and Turbo
  // Eslintrc to editor get the linting rules from the monorepo
};

// const configurePackagesJson = async () => {};

export const setupMonorepoCommand: CommandModule = {
  command: ['setup', '$0'],
  describe: 'Setup the monorepo',
  builder: {},
  handler: async (argv) => {
    if (argv._.length === 0) {
      log.info(logPrefix, 'Setup the monorepo');

      await executeCommands();
      await writeFiles();
      // await configurePackagesJson();
    }
  },
};
