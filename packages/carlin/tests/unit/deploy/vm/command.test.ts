import log from 'npmlog';

import { deployVMCommand } from '../../../../src/deploy/vm/command';
import { options } from '../../../../src/deploy/vm/command.options';
import * as deployVMModule from '../../../../src/deploy/vm/deployVM';

jest.mock('../../../../src/deploy/vm/deployVM');
jest.mock('npmlog');

describe('vm command', () => {
  const mockDeployVM = deployVMModule.deployVM as jest.MockedFunction<
    typeof deployVMModule.deployVM
  >;
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
      };

      const result = deployVMCommand.builder(mockYargs);

      expect(mockYargs.options).toHaveBeenCalled();
      expect(result).toBe(mockYargs);
    });

    test('should add group to individual options', () => {
      const mockYargs = {
        options: jest.fn((opts) => {
          // Verify each option has group property
          for (option of Object.values(opts)) {
            expect(option).toHaveProperty('group', 'Deploy VM Options');
          }
          return mockYargs;
        }),
      };

      deployVMCommand.builder(mockYargs);
    });
  });

  describe('handler execution', () => {
    test('should call deployVM with correct parameters using SSH key', async () => {
      mockDeployVM.mockResolvedValueOnce();

      await deployVMCommand.handler({
        userName: 'ubuntu',
        host: '192.168.1.100',
        scriptPath: '/path/to/deploy.sh',
        keyPath: '/path/to/key.pem',
        port: 22,
        fixPermissions: false,
        $0: 'carlin',
        _: ['deploy', 'vm'],
      });

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

      await deployVMCommand.handler({
        userName: 'root',
        host: 'example.com',
        scriptPath: '/deploy.sh',
        password: 'mypassword',
        port: 2222,
        fixPermissions: true,
        $0: 'carlin',
        _: ['deploy', 'vm'],
      });

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

      await deployVMCommand.handler({
        userName: 'user',
        host: 'host',
        scriptPath: '/script.sh',
        keyPath: '/key.pem',
        port: 22,
        fixPermissions: false,
        $0: 'carlin',
        _: ['deploy', 'vm'],
      });

      expect(log.info).toHaveBeenCalledWith(
        'deploy-vm',
        'Deployment completed successfully!'
      );
    });

    test('should exit with code 1 when deployment fails', async () => {
      const error = new Error('SSH connection failed');
      mockDeployVM.mockRejectedValueOnce(error);

      await deployVMCommand.handler({
        userName: 'user',
        host: 'host',
        scriptPath: '/script.sh',
        keyPath: '/key.pem',
        port: 22,
        fixPermissions: false,
        $0: 'carlin',
        _: ['deploy', 'vm'],
      });

      expect(log.error).toHaveBeenCalledWith(
        'deploy-vm',
        'Deployment failed: %s',
        'SSH connection failed'
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    test('should handle deployment with custom port', async () => {
      mockDeployVM.mockResolvedValueOnce();

      await deployVMCommand.handler({
        userName: 'deploy',
        host: '10.0.0.1',
        scriptPath: '/opt/deploy.sh',
        keyPath: '/keys/deploy.pem',
        port: 8022,
        fixPermissions: true,
        $0: 'carlin',
        _: ['deploy', 'vm'],
      });

      expect(mockDeployVM).toHaveBeenCalledWith(
        expect.objectContaining({
          port: 8022,
          fixPermissions: true,
        })
      );
    });

    test('should pass all parameters to deployVM correctly', async () => {
      mockDeployVM.mockResolvedValueOnce();

      await deployVMCommand.handler({
        userName: 'admin',
        host: '203.0.113.42',
        scriptPath: '/home/admin/setup.sh',
        keyPath: '/home/admin/.ssh/id_rsa',
        password: undefined,
        port: 22,
        fixPermissions: false,
        $0: 'carlin',
        _: ['deploy', 'vm'],
      });

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
  });
});
