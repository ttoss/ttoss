import type { Argv } from 'yargs';
import yargs from 'yargs';

import { deployVMCommand } from '../../../../src/deploy/vm/command';
import {
  options,
  type VmCommandOptions,
} from '../../../../src/deploy/vm/command.options';
import { deployVM } from '../../../../src/deploy/vm/deployVM';

// Mock the dependencies
jest.mock('../../../../src/deploy/vm/deployVM', () => {
  return {
    deployVM: jest.fn(),
  };
});
jest.mock('npmlog');

// Import after mocking
import log from 'npmlog';

// Type casting for typed access to mocks
const mockLogInfo = log.info as jest.MockedFunction<typeof log.info>;
const mockLogError = log.error as jest.MockedFunction<typeof log.error>;

const mockDeployVM = deployVM as jest.MockedFunction<typeof deployVM>;

// Create local CLI (as in command.test.ts)
const cli = yargs().command(deployVMCommand);

const parse = (command: string, options: VmCommandOptions = {}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Promise<any>((resolve, reject) => {
    cli.parse(command, options, (err, argv) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(argv);
    });
  });
};

describe('vm command', () => {
  const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
    return undefined as never;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    mockExit.mockRestore();
  });

  describe('command metadata', () => {
    test('should have correct command name', () => {
      expect(deployVMCommand.command).toBe('vm');
    });

    test('should have a description', () => {
      expect(deployVMCommand.describe).toBeDefined();
      expect(typeof deployVMCommand.describe).toBe('string');
      expect(deployVMCommand.describe).toContain('VM');
    });

    test('should have builder and handler functions', () => {
      expect(typeof deployVMCommand.builder).toBe('function');
      expect(typeof deployVMCommand.handler).toBe('function');
    });
  });

  describe('options validation', () => {
    test('should require user-name option', () => {
      expect(options['user-name'].demandOption).toBe(true);
      expect(options['user-name'].type).toBe('string');
      expect(options['user-name'].describe).toContain('user');
    });

    test('should require host option', () => {
      expect(options['host'].demandOption).toBe(true);
      expect(options['host'].type).toBe('string');
      expect(options['host'].describe).toContain('host');
    });

    test('should require script-path option', () => {
      expect(options['script-path'].demandOption).toBe(true);
      expect(options['script-path'].type).toBe('string');
      expect(options['script-path'].describe).toContain('script');
    });

    test('should have port with default value 22', () => {
      expect(options['port'].type).toBe('number');
      expect(options['port'].default).toBe(22);
      expect(options['port'].describe).toContain('port');
    });

    test('should have optional key-path for SSH key authentication', () => {
      expect(options['key-path'].type).toBe('string');
      expect(options['key-path'].describe).toContain('key');
    });

    test('should have optional password for password authentication', () => {
      expect(options['password'].type).toBe('string');
      expect(options['password'].describe).toContain('password');
    });

    test('should have fix-permissions with default false', () => {
      expect(options['fix-permissions'].type).toBe('boolean');
      expect(options['fix-permissions'].default).toBe(false);
      expect(options['fix-permissions'].describe).toContain('permissions');
    });
  });

  describe('builder function', () => {
    test('should return yargs instance with options', () => {
      const mockYargs = {
        options: jest.fn().mockReturnThis(),
      } as unknown as Argv;

      const result = deployVMCommand.builder(mockYargs as Argv);

      expect(mockYargs.options).toHaveBeenCalled();
      expect(result).toBe(mockYargs);
    });

    test('should add group to individual options', () => {
      let optionsCount = 0;

      const mockYargs = {
        options: jest.fn((opts) => {
          // Count each option
          const optionsArray = Object.values(opts);
          optionsCount = optionsArray.length;

          // Verify each option has group property
          for (const option of Object.values(opts)) {
            expect(option).toHaveProperty('group', 'Deploy VM Options');
          }
          return mockYargs;
        }),
      } as unknown as Argv;

      deployVMCommand.builder(mockYargs as Argv);

      expect(optionsCount).toBe(7);
    });
  });

  describe('handler execution', () => {
    test('should call deployVM with correct parameters using SSH key', async () => {
      mockDeployVM.mockResolvedValueOnce();

      await parse(
        'vm --user-name ubuntu --host 192.168.1.100 --script-path /path/to/deploy.sh --key-path /path/to/key.pem --port 22'
      );

      expect(mockDeployVM).toHaveBeenCalledWith({
        userName: 'ubuntu',
        host: '192.168.1.100',
        scriptPath: '/path/to/deploy.sh',
        keyPath: '/path/to/key.pem',
        password: undefined,
        port: 22,
        fixPermissions: false,
      });
    });

    test('should call deployVM with password authentication', async () => {
      mockDeployVM.mockResolvedValueOnce();

      await parse(
        'vm --user-name root --host example.com --script-path /deploy.sh --password mypassword --port 2222 --fix-permissions'
      );

      expect(mockDeployVM).toHaveBeenCalledWith({
        userName: 'root',
        host: 'example.com',
        scriptPath: '/deploy.sh',
        keyPath: undefined,
        password: 'mypassword',
        port: 2222,
        fixPermissions: true,
      });
    });

    test('should log success message after successful deployment', async () => {
      mockDeployVM.mockResolvedValueOnce();

      await parse(
        'vm --user-name user --host host --script-path /script.sh --key-path /key.pem'
      );

      expect(mockLogInfo).toHaveBeenCalledWith(
        'deploy-vm',
        'Deployment completed successfully!'
      );
    });

    test('should exit with code 1 when deployment fails', async () => {
      const error = new Error('SSH connection failed');
      mockDeployVM.mockRejectedValueOnce(error);

      await parse(
        'vm --user-name user --host host --script-path /script.sh --key-path /key.pem'
      );

      expect(mockLogError).toHaveBeenCalledWith(
        'deploy-vm',
        'Deployment failed: %s',
        'SSH connection failed'
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    test('should handle deployment with custom port', async () => {
      mockDeployVM.mockResolvedValueOnce();

      await parse(
        'vm --user-name deploy --host 10.0.0.1 --script-path /opt/deploy.sh --key-path /keys/deploy.pem --port 8022 --fix-permissions'
      );

      expect(mockDeployVM).toHaveBeenCalledWith(
        expect.objectContaining({
          port: 8022,
          fixPermissions: true,
        })
      );
    });

    test('should pass all parameters to deployVM correctly', async () => {
      mockDeployVM.mockResolvedValueOnce();

      await parse(
        'vm --user-name admin --host 203.0.113.42 --script-path /home/admin/setup.sh --key-path /home/admin/.ssh/id_rsa'
      );

      expect(mockDeployVM).toHaveBeenCalledTimes(1);
      expect(mockDeployVM).toHaveBeenCalledWith({
        userName: 'admin',
        host: '203.0.113.42',
        scriptPath: '/home/admin/setup.sh',
        keyPath: '/home/admin/.ssh/id_rsa',
        password: undefined,
        port: 22,
        fixPermissions: false,
      });
    });

    test('should accept kebab-case from CLI string', async () => {
      mockDeployVM.mockResolvedValueOnce();

      // Parse with string simulates real CLI
      await parse(
        'vm --user-name ubuntu --host 192.168.1.100 --script-path /deploy.sh --key-path /key.pem'
      );

      expect(mockDeployVM).toHaveBeenCalledWith(
        expect.objectContaining({
          userName: 'ubuntu', // ← Yargs converted user-name → userName
        })
      );
    });

    test('should validate required options', async () => {
      // Without required options, should throw error
      await expect(parse('vm')).rejects.toThrow();
    });

    test('should use default values when not specified', async () => {
      mockDeployVM.mockResolvedValueOnce();

      const argv = await parse(
        'vm --user-name user --host host --script-path /script.sh --key-path /key.pem'
      );

      // Verify default values are applied
      expect(argv.port).toBe(22);
      expect(argv.fixPermissions).toBe(false);
    });
  });
});
