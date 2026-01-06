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
      if (typeof userName !== 'string') {
        throw new Error('Invalid or missing "userName" option for deploy-vm command.');
      }

      if (typeof host !== 'string') {
        throw new Error('Invalid or missing "host" option for deploy-vm command.');
      }

      if (typeof scriptPath !== 'string') {
        throw new Error('Invalid or missing "scriptPath" option for deploy-vm command.');
      }

      if (typeof keyPath !== 'string') {
        throw new Error('Invalid or missing "keyPath" option for deploy-vm command.');
      }

      if (password != null && typeof password !== 'string') {
        throw new Error('Invalid "password" option for deploy-vm command.');
      }

      if (port != null && typeof port !== 'number') {
        throw new Error('Invalid "port" option for deploy-vm command.');
      }

      if (typeof fixPermissions !== 'boolean') {
        throw new Error('Invalid "fixPermissions" option for deploy-vm command.');
      }

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
