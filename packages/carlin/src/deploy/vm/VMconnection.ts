interface SshCommandParams {
  userName: string;
  host: string;
  keyPath?: string;
  port?: number;
}

/**
 * Generates an SSH command array for key-based authentication.
 * @param userName - SSH username for the connection.
 * @param host - Remote host address or hostname.
 * @param keyPath - Optional path to the SSH private key file.
 * @param port - SSH port (default: 22).
 * @returns Array of command parts for spawning SSH process.
 */
const generateSSHCommand = ({
  userName,
  host,
  keyPath,
  port,
}: SshCommandParams): string[] => {
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

interface SshCommandWithPwdParams {
  userName: string;
  host: string;
  password: string;
  port?: number;
}

/**
 * Generate an SSH command configuration that uses password-based authentication
 * with the native `ssh` client.
 *
 * The password is **not** embedded in the command line; instead, it is returned
 * separately and is expected to be written to the SSH process stdin when the
 * client prompts for a password. This avoids exposing the password in process
 * listings but still relies on password authentication, which is generally less
 * secure than key-based authentication.
 */
const generateSSHCommandWithPwd = ({
  userName,
  host,
  password,
  port,
}: SshCommandWithPwdParams): { command: string[]; password: string } => {
  const commandParts = [
    'ssh',
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
