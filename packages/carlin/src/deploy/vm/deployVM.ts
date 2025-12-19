import { spawn } from 'node:child_process';
import { chmodSync, createReadStream, existsSync, statSync } from 'node:fs';

import log from 'npmlog';

import { generateSSHCommand, generateSSHCommandWithPwd } from './VMconnection';

/**
 * Deploys to a VM via SSH by executing a deployment script.
 * Supports both SSH key authentication and password authentication.
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
        `It should have at least key path (keyPath) or password (password).`
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
      sshCommand = generateSSHCommand(userName, host, keyPath, port);
    } else if (password) {
      const result = generateSSHCommandWithPwd(userName, host, password, port);
      sshCommand = result.command;
      sshPassword = result.password;
    } else {
      throw new Error('keyPath and password not found, try to use one of them');
    }

    const sshProcess = spawn(sshCommand[0], sshCommand.slice(1), {
      stdio: ['pipe', 'inherit', 'inherit'],
      shell: true,
    });

    // Send password via stdin when using password authentication
    if (sshPassword) {
      sshProcess.stdin?.write(sshPassword + '\n');
    }

    const deployScript = createReadStream(scriptPath);
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
