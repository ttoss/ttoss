import * as fs from 'fs';
import { spawn } from '../spawn';

export const installPackages = [
  '@ttoss/config',
  '@commitlint/cli',
  'husky',
  'lint-staged',
];

const commitlintrc = `
const { commitlintConfig } = require('@ttoss/config');

module.exports = commitlintConfig();
`;

const lintstagedrc = `
const { lintstagedConfig } = require('@ttoss/config');

module.exports = lintstagedConfig();
`;

export const executeCommands = () => {
  fs.writeFileSync('.commitlintrc.js', commitlintrc);
  fs.writeFileSync('.lintstagedrc.js', lintstagedrc);

  /**
   * https://typicode.github.io/husky/#/?id=automatic-recommended
   */
  spawn('rm', ['-rf', '.husky']);
  spawn('npx', ['husky', 'install']);
  spawn('npm', ['set-script', 'prepare', 'husky install']);
  spawn('npx', ['husky', 'add', '.husky/commit-msg', 'yarn commitlint --edit']);
  spawn('npx', ['husky', 'add', '.husky/pre-commit', 'yarn lint-staged']);
  spawn('yarn', ['husky', 'install']);
};
