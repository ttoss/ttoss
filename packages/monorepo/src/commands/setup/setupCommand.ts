import { type CommandModule } from 'yargs';
import { SetupOptions, setupOptions } from './setupOptions';
import { commitlint } from './tools/commitlint';
import { eslint } from './tools/eslint';
import { executeTools } from './executeTools';
import { git } from './tools/git';
import { husky } from './tools/husky';
import { pnpm } from './tools/pnpm';
import { syncpack } from './tools/syncpack';
import { turbo } from './tools/turbo';
import log from 'npmlog';

const logPrefix = '@ttoss/monorepo';

export const setupCommand: CommandModule<any, SetupOptions> = {
  command: ['setup'],
  describe: 'Setup monorepo',
  builder: (builder) => {
    builder.options(setupOptions);
    return builder;
  },
  handler: async (options) => {
    log.info(logPrefix, 'Setup monorepo');

    await executeTools({
      options,
      tools: [pnpm, husky, turbo, eslint, syncpack, git, commitlint],
    });
  },
};
