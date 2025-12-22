export const options = {
  'user-name': {
    demandOption: true,
    describe: 'SSH user name to connect to the VM (e.g., ec2-user, ubuntu)',
    type: 'string',
  },
  host: {
    demandOption: true,
    describe: 'VM host IP address or DNS name',
    type: 'string',
  },
  port: {
    describe: 'SSH port (default: 22)',
    type: 'number',
    default: 22,
  },
  'key-path': {
    describe: 'Path to the SSH private key file (.pem)',
    type: 'string',
  },
  password: {
    describe: 'SSH password (use key-path for better security)',
    type: 'string',
  },
  'script-path': {
    demandOption: true,
    describe: 'Path to the deployment script to execute on the VM',
    type: 'string',
  },
  'fix-permissions': {
    describe: 'Automatically fix SSH key permissions if too open',
    type: 'boolean',
    default: false,
  },
} as const;

export type VmCommandOptions = Partial<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key in keyof typeof options]: any;
}>;
