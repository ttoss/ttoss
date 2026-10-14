import type { CommandModule, InferredOptionTypes } from 'yargs';

import { NAME } from '../../config';
import { addGroupToOptions } from '../../utils';
import { log } from '../../utils/log';
import { options } from './command.options';
import { deployCicd } from './deployCicd';
import { readSSHKey } from './readSSHKey';

const logPrefix = 'deploy-cicd';

export const deployCicdCommand: CommandModule<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any,
  InferredOptionTypes<typeof options>
> = {
  command: 'cicd',
  describe: 'Deploy CICD.',
  builder: (yargs) => {
    return yargs.options(addGroupToOptions(options, 'Deploy CICD Options'));
  },
  handler: ({ destroy, ...rest }) => {
    if (destroy) {
      log.info(logPrefix, `${NAME} doesn't destroy CICD stack.`);
    } else {
      deployCicd({
        ...rest,
        sshKey: readSSHKey(rest['ssh-key']),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    }
  },
};
