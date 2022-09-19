import { spawn } from '../spawn';

export const installPackages = ['@ttoss/config', 'husky'];

export const executeCommands = () => {
  /**
   * https://typicode.github.io/husky/#/?id=automatic-recommended
   */
  spawn('rm', ['.husky/pre-commit']);
  spawn('npx', ['husky-init']);
  spawn('yarn');
  spawn('npx', [
    'husky',
    'add',
    '.husky/pre-commit',
    'yarn lint-staged -c node_modules/@ttoss/monorepo/config/lintstagedrc.js',
  ]);
  spawn('yarn', ['husky', 'install']);
};
