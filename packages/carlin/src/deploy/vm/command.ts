import log from 'npmlog';
import type { CommandModule, InferredOptionTypes } from 'yargs';

import { addGroupToOptions } from '../../utils';
import { deployVM } from './deployVM';

const logPrefix = 'deploy-vm';

export const options = {
  'vm-user-name': {
    demandOption: true,
    describe: 'SSH user name to connect to the VM (e.g., ec2-user, ubuntu)',
    type: 'string',
  },
  'vm-host': {
    demandOption: true,
    describe: 'VM host IP address or DNS name',
    type: 'string',
  },
  'vm-port': {
    describe: 'SSH port (default: 22)',
    type: 'number',
    default: 22,
  },
  'vm-key-path': {
    describe: 'Path to the SSH private key file (.pem)',
    type: 'string',
  },
  'vm-password': {
    describe: 'SSH password (use key-path for better security)',
    type: 'string',
  },
  'vm-script-path': {
    demandOption: true,
    describe: 'Path to the deployment script to execute on the VM',
    type: 'string',
  },
  'vm-fix-permissions': {
    describe: 'Automatically fix SSH key permissions if too open',
    type: 'boolean',
    default: false,
  },
} as const;

export const deployVMCommand: CommandModule<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any,
  InferredOptionTypes<typeof options>
> = {
  command: 'vm',
  describe: 'Deploy to a VM via SSH by executing a deployment script',
  builder: (yargs) => {
    return yargs.options(addGroupToOptions(options, 'Deploy VM Options'));
  },
  handler: async ({
    vmUserName,
    vmHost,
    vmPort,
    vmKeyPath,
    vmScriptPath,
    vmPassword,
    vmFixPermissions,
  }) => {
    try {
      await deployVM({
        userName: vmUserName as string,
        host: vmHost as string,
        scriptPath: vmScriptPath as string,
        keyPath: vmKeyPath as string,
        password: vmPassword as string,
        port: vmPort as number,
        fixPermissions: vmFixPermissions as boolean,
      });

      log.info(logPrefix, 'Deployment completed successfully!');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      log.error(logPrefix, 'Deployment failed: %s', error.message);
      process.exit(1);
    }
  },
};
