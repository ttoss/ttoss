/* eslint-disable no-param-reassign */
import { CommandModule, InferredOptionTypes } from 'yargs';
import { addGroupToOptions } from '../../utils';
import { deployVercel } from './deployVercel';
import log from 'npmlog';

const logPrefix = 'deploy vercel';

export const options = {
  token: {
    describe: 'Vercel authorization token.',
    type: 'string',
  },
} as const;

export const deployVercelCommand: CommandModule<
  any,
  InferredOptionTypes<typeof options>
> = {
  command: 'vercel',
  describe: 'Deploy on Vercel.',
  builder: (yargs) => {
    return yargs.options(
      addGroupToOptions(options, 'Deploy on Vercel Options')
    );
  },
  handler: ({ destroy, ...rest }) => {
    if (destroy) {
      log.info(logPrefix, 'Destroy Vercel deployment not implemented yet.');
    } else {
      deployVercel(rest);
    }
  },
};
