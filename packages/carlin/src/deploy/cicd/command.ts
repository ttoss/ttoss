import { CommandModule, InferredOptionTypes } from 'yargs';
import { NAME } from '../../config';
import { addGroupToOptions } from '../../utils';
import { deployCicd } from './deployCicd';
import { options } from './command.options';
import { readSSHKey } from './readSSHKey';
import log from 'npmlog';

const logPrefix = 'deploy-cicd';

export const deployCicdCommand: CommandModule<
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
      } as any);
    }
  },
};
