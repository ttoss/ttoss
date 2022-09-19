import * as eslintTool from './tools/eslint';
import * as huskyTool from './tools/husky';
import * as lernaTool from './tools/lerna';
import * as turboTool from './tools/turbo';
import { CommandModule } from 'yargs';
import { spawn } from './spawn';
import log from 'npmlog';

const logPrefix = '@ttoss/monorepo';

const tools = [eslintTool, huskyTool, lernaTool, turboTool];

const installPackages = () => {
  spawn('yarn', [
    'add',
    '-DW',
    ...tools.map((tool) => tool.installPackages).flat(),
  ]);
};

const executeCommands = () => {
  tools.forEach((tool) => tool.executeCommands());
};

// const configurePackagesJson = async () => {};

export const setupMonorepoCommand: CommandModule = {
  command: ['setup', '$0'],
  describe: 'Setup the monorepo',
  builder: {},
  handler: async (argv) => {
    if (argv._.length === 0) {
      log.info(logPrefix, 'Setup the monorepo');

      installPackages();
      executeCommands();
    }
  },
};
