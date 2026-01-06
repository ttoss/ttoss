import { spawn } from 'node:child_process';
import { chmodSync, createReadStream, existsSync, statSync } from 'node:fs';

import log from 'npmlog';

import { generateSSHCommand, generateSSHCommandWithPwd } from './VMconnection';

/**
 * Deploys to a remote virtual machine over SSH by executing a local
 * deployment script on the target host.
 *
 * This function supports both SSH key-based authentication (preferred) and
 * password-based authentication. It validates the provided
 * {@link DeployVMParams}, optionally fixes local script permissions, and then
 * spawns an SSH process to run the script remotely.
 *
 * Security considerations:
 * - Prefer `keyPath` over `password` whenever possible.
 * - Do not hard-code passwords in source code; use environment variables or a
 *   secure secret store instead.
 * - Ensure that private keys referenced by `keyPath` are stored securely and
 *   have appropriate filesystem permissions.
 *
 * @param params - Configuration object describing how to connect and which
 *   script to execute. See {@link DeployVMParams}.
 * @returns A promise that resolves when the deployment script finishes
 *   successfully, or rejects if the SSH command fails or parameters are
 *   invalid.
 * @throws {Error} If required parameters (`userName`, `host`, `scriptPath`)
 *   are missing, or if neither `keyPath` nor `password` is provided.
 *
 * @example
 * // Key-based authentication
 * await deployVM({
 *   userName: 'ubuntu',
 *   host: '203.0.113.10',
 *   scriptPath: './scripts/deploy.sh',
 *   keyPath: '~/.ssh/id_rsa',
 *   port: 22,
 *   fixPermissions: true,
 * });
 *
 * @example
 * // Password-based authentication (use environment variables or a secret
 * // manager to supply the password in real deployments)
 * await deployVM({
 *   userName: 'root',
 *   host: 'example.com',
 *   scriptPath: './scripts/deploy.sh',
 *   password: process.env.DEPLOY_VM_PASSWORD as string,
 * });
 */

export interface DeployVMParams {
  userName: string;
  host: string;
  scriptPath: string;
  keyPath?: string;
  password?: string;
  port?: number;
  fixPermissions?: boolean;
}

const logPrefix = 'deploy-vm';

export const deployVM = async ({
  userName,
  host,
  scriptPath,
  keyPath,
  password,
  port,
  fixPermissions = false,
}: DeployVMParams): Promise<void> => {
  // Validate required parameters
  if (!userName || !host || !scriptPath) {
    throw new Error('Missing required parameters: userName, host, scriptPath');
  }

  return new Promise((resolve, reject) => {
    if (!keyPath && !password) {
      throw new Error(
        `Authentication method required. Provide either --vm-key-path for SSH key authentication or --vm-password for password authentication.`
      );
    }

    if (keyPath && !existsSync(keyPath)) {
      throw new Error(`SSH key not found at ${keyPath}`);
    }

    // Check and fix SSH key permissions if using key authentication
    if (keyPath) {
      try {
        const stats = statSync(keyPath);
        // Extract only permission bits (last 9 bits) using bitwise AND with octal 777
        // This masks out file type bits, leaving only user/group/other permissions
        const permissions = stats.mode & 0o777;

        // SSH requires private keys to have restricted permissions (400 or 600 only)
        // 0o400 = read-only by owner (r--------)
        // 0o600 = read-write by owner (rw-------)
        const isSecure = permissions === 0o400 || permissions === 0o600;

        if (!isSecure) {
          const permissionStr = permissions.toString(8);
          const fixCommand = `chmod 400 ${keyPath}`;

          if (fixPermissions) {
            log.info(
              logPrefix,
              `Fixing SSH key permissions: ${keyPath} (${permissionStr} → 400)`
            );
            chmodSync(keyPath, 0o400);
            log.info(logPrefix, `Permissions set to 400 (read-only by owner)`);
          } else {
            log.error(
              logPrefix,
              `SSH key permissions too open: ${permissionStr} (octal)`
            );
            log.error(logPrefix, `SSH requires permissions 400 or 600`);
            log.error(logPrefix, `Fix manually: ${fixCommand}`);
            log.error(logPrefix, `Or run with: --vm-fix-permissions`);
            throw new Error(
              `Invalid SSH key permissions: ${permissionStr}. Expected 400 or 600.`
            );
          }
        } else {
          log.info(
            logPrefix,
            `SSH key permissions OK: ${permissions.toString(8)}`
          );
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        if (error.message.includes('Invalid SSH key permissions')) {
          throw error; // Re-throw permission errors
        }
        log.warn(
          logPrefix,
          `Warning: Could not check key permissions: ${error.message}`
        );
      }
    }

    let sshCommand: string[];
    let sshPassword: string | undefined;

    if (keyPath) {
      sshCommand = generateSSHCommand({ userName, host, keyPath, port });
    } else {
      // password must be defined here due to earlier validation
      const result = generateSSHCommandWithPwd({
        userName,
        host,
        password: password!,
        port,
      });
      sshCommand = result.command;
      sshPassword = result.password;
    }

    const sshProcess = spawn(sshCommand[0], sshCommand.slice(1), {
      stdio: ['pipe', 'inherit', 'inherit'],
    });

    const validateStdin = (
      stdin: typeof sshProcess.stdin
    ): stdin is NonNullable<typeof stdin> => {
      if (!stdin) {
        log.error(logPrefix, 'SSH process stdin is null or undefined');
        return false;
      }

      if (stdin.destroyed) {
        log.error(logPrefix, 'SSH process stdin has been destroyed');
        return false;
      }

      if (!stdin.writable) {
        log.error(logPrefix, 'SSH process stdin is not writable');
        return false;
      }

      return true;
    };

    // Validate stdin is available and writable
    if (!validateStdin(sshProcess.stdin)) {
      reject(new Error('SSH process stdin is not available or not writable'));
      return;
    }

    // Validate that the deployment script exists before creating a read stream
    if (!existsSync(scriptPath)) {
      const message = `Deployment script not found at path: ${scriptPath}`;
      log.error(logPrefix, message);
      reject(new Error(message));
      return;
    }
    const deployScript = createReadStream(scriptPath);

    // Send password via stdin when using password authentication
    if (sshPassword) {
      sshProcess.stdin.write(sshPassword + '\n');
    }

    // Pipe deployment script to stdin
    deployScript.pipe(sshProcess.stdin);

    sshProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Deploy failed with code ${code}`));
      }
    });

    sshProcess.on('error', (error) => {
      reject(error);
    });

    process.on('SIGINT', () => {
      log.info(logPrefix, 'Interrupting deployment...');
      sshProcess.kill('SIGINT');
      process.exit(130);
    });
  });
};
