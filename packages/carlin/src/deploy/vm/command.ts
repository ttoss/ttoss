import log from 'npmlog';
import type { CommandModule, InferredOptionTypes } from 'yargs';

import { addGroupToOptions } from '../../utils';
import { options } from './command.options';
import { deployVM } from './deployVM';

const logPrefix = 'deploy-vm';

export interface VMServer {
  name: string;
  userName: string;
  host: string;
  keyPath: string;
  port?: number;
  password?: string;
}

export const deployVMCommand: CommandModule<
  VMServer,
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
        userName: userName as string,
        host: host as string,
        scriptPath: scriptPath as string,
        keyPath: keyPath as string,
        password: password as string,
        port: port as number,
        fixPermissions: fixPermissions as boolean,
      });

      log.info(logPrefix, 'Deployment completed successfully!');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      log.error(logPrefix, 'Deployment failed: %s', error.message);
      process.exit(1);
    }
  },
};
