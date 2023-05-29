import { type CommandModule } from 'yargs';
import { SetupOptions, cicdOptions, setupOptions } from './setupOptions';
import { cicd } from './tools/cicd';
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
    Object.entries(cicdOptions).forEach(([key, optionConfig]) => {
      builder.options({
        [`cicd.${key}`]: {
          ...optionConfig,
        },
      });
    });
    return builder;
  },
  handler: async (options) => {
    log.info(logPrefix, 'Setup monorepo');

    await executeTools({
      options,
      tools: [
        // pnpm, husky, turbo, eslint, syncpack, git, commitlint,
        cicd,
      ],
    });
  },
};
