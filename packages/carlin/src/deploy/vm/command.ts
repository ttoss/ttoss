import log from 'npmlog';
import type { CommandModule, InferredOptionTypes } from 'yargs';

import { addGroupToOptions } from '../../utils';
import { options } from './command.options';
import { deployVM } from './deployVM';

const logPrefix = 'deploy-vm';

export const deployVMCommand: CommandModule<
  Record<string, unknown>,
  InferredOptionTypes<typeof options>
> = {
  command: 'vm',
  describe: 'Deploy to a VM via SSH by executing a deployment script',
  builder: (yargs) => {
    return yargs.options(addGroupToOptions(options, 'Deploy VM Options'));
  },
  handler: async ({
    userName,
    host,
    port,
    keyPath,
    scriptPath,
    password,
    fixPermissions,
  }) => {
    try {
      await deployVM({
        userName,
        host,
        scriptPath,
        keyPath,
        password,
        port,
        fixPermissions,
      });

      log.info(logPrefix, 'Deployment completed successfully!');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      log.error(logPrefix, 'Deployment failed: %s', error.message);
      process.exit(1);
    }
  },
};
