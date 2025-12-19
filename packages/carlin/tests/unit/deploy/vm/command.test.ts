import { deployVMCommand, options } from '../../../../src/deploy/vm/command';

jest.mock('../../../../src/deploy/vm/deployVM');
jest.mock('npmlog');

describe('vm command', () => {
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
    test('should require vm-user-name option', () => {
      expect(options['vm-user-name'].demandOption).toBe(true);
      expect(options['vm-user-name'].type).toBe('string');
      expect(options['vm-user-name'].describe).toContain('user');
    });

    test('should require vm-host option', () => {
      expect(options['vm-host'].demandOption).toBe(true);
      expect(options['vm-host'].type).toBe('string');
      expect(options['vm-host'].describe).toContain('host');
    });

    test('should require vm-script-path option', () => {
      expect(options['vm-script-path'].demandOption).toBe(true);
      expect(options['vm-script-path'].type).toBe('string');
      expect(options['vm-script-path'].describe).toContain('script');
    });

    test('should have vm-port with default value 22', () => {
      expect(options['vm-port'].type).toBe('number');
      expect(options['vm-port'].default).toBe(22);
      expect(options['vm-port'].describe).toContain('port');
    });

    test('should have optional vm-key-path for SSH key authentication', () => {
      expect(options['vm-key-path'].type).toBe('string');
      expect(options['vm-key-path'].describe).toContain('key');
    });

    test('should have optional vm-password for password authentication', () => {
      expect(options['vm-password'].type).toBe('string');
      expect(options['vm-password'].describe).toContain('password');
    });

    test('should have vm-fix-permissions with default false', () => {
      expect(options['vm-fix-permissions'].type).toBe('boolean');
      expect(options['vm-fix-permissions'].default).toBe(false);
      expect(options['vm-fix-permissions'].describe).toContain('permissions');
    });
  });
});
