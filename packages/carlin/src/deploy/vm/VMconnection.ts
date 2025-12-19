export interface VMServer {
  vmName: string;
  vmUserName: string;
  vmHost: string;
  vmKeyPath: string;
  vmPort?: number;
  vmPassword?: string;
}

/**
 * generate SSH command with private key.
 * @param port - default ssh port: 22
 */
const generateSSHCommand = (
  userName: string,
  host: string,
  keyPath?: string,
  port?: number
  // eslint-disable-next-line max-params
): string[] => {
  const commandParts = ['ssh', '-T'];

  // Adds private key if provided
  if (keyPath) {
    commandParts.push('-i', keyPath);
  }

  // Adds custom port if provided
  if (port && port !== 22) {
    commandParts.push('-p', port.toString());
  }

  commandParts.push(`${userName}@${host}`, 'bash -s');

  return commandParts;
};

/**
 * Generate SSH command with password using native SSH.
 * The password will be passed via stdin when SSH process requests it.
 * @param port - default ssh port: 22
 */
const generateSSHCommandWithPwd = (
  userName: string,
  host: string,
  password: string,
  port?: number
  // eslint-disable-next-line max-params
): { command: string[]; password: string } => {
  const commandParts = [
    'ssh',
    '-o',
    'StrictHostKeyChecking=no',
    '-o',
    'UserKnownHostsFile=/dev/null',
    '-o',
    'PubkeyAuthentication=no',
    '-o',
    'PreferredAuthentications=password',
  ];

  // Adds custom port if provided
  if (port && port !== 22) {
    commandParts.push('-p', port.toString());
  }

  commandParts.push(`${userName}@${host}`, 'bash -s');

  return {
    command: commandParts,
    password,
  };
};

export { generateSSHCommand, generateSSHCommandWithPwd };
