/* eslint-disable no-param-reassign */
import { Command } from 'commander';
import { deployVercel } from './deployVercel';
import log from 'npmlog';

const logPrefix = 'deploy vercel';

export const options = {
  token: {
    describe: 'Vercel authorization token.',
    type: 'string',
  },
} as const;

export const deployVercelCommand = new Command('vercel')
  .description('Deploy on Vercel.')
  .allowUnknownOption(true)
  .option('--token <token>', options.token.describe)
  .action(async function (this: Command) {
    const opts = this.opts();
    const parentOpts = this.parent?.parent?.opts() || {};
    const allOpts = { ...parentOpts, ...opts };

    if (allOpts.destroy) {
      log.info(logPrefix, 'Destroy Vercel deployment not implemented yet.');
    } else {
      await deployVercel(allOpts);
    }
  });
