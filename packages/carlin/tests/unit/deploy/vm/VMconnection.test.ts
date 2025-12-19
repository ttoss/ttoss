import {
  generateSSHCommand,
  generateSSHCommandWithPwd,
} from '../../../../src/deploy/vm/VMconnection';

describe('VMconnection', () => {
  describe('generateSSHCommand', () => {
    test('should generate SSH command with key and default port', () => {
      const result = generateSSHCommand({
        userName: 'ubuntu',
        host: '192.168.1.100',
        keyPath: '/path/to/key.pem',
      });

      expect(result).toEqual([
        'ssh',
        '-T',
        '-i',
        '/path/to/key.pem',
        'ubuntu@192.168.1.100',
        'bash -s',
      ]);
    });

    test('should generate SSH command with key and custom port', () => {
      const result = generateSSHCommand({
        userName: 'root',
        host: 'example.com',
        keyPath: '/home/user/.ssh/id_rsa',
        port: 2222,
      });

      expect(result).toEqual([
        'ssh',
        '-T',
        '-i',
        '/home/user/.ssh/id_rsa',
        '-p',
        '2222',
        'root@example.com',
        'bash -s',
      ]);
    });

    test('should generate SSH command without key path', () => {
      const result = generateSSHCommand({
        userName: 'admin',
        host: '10.0.0.1',
      });

      expect(result).toEqual(['ssh', '-T', 'admin@10.0.0.1', 'bash -s']);
    });

    test('should not add port flag when port is 22', () => {
      const result = generateSSHCommand({
        userName: 'user',
        host: 'server.com',
        keyPath: '/key.pem',
        port: 22,
      });

      expect(result).toEqual([
        'ssh',
        '-T',
        '-i',
        '/key.pem',
        'user@server.com',
        'bash -s',
      ]);
      expect(result).not.toContain('-p');
    });

    test('should handle hostname with domain', () => {
      const result = generateSSHCommand({
        userName: 'deploy',
        host: 'prod-server.company.com',
        keyPath: '/keys/deploy.pem',
        port: 8022,
      });

      expect(result).toContain('deploy@prod-server.company.com');
      expect(result).toContain('-p');
      expect(result).toContain('8022');
    });
  });

  describe('generateSSHCommandWithPwd', () => {
    test('should generate SSH command with password and default port', () => {
      const result = generateSSHCommandWithPwd({
        userName: 'root',
        host: '192.168.1.50',
        password: 'mySecretPass',
      });

      expect(result.command).toEqual([
        'ssh',
        '-o',
        'PubkeyAuthentication=no',
        '-o',
        'PreferredAuthentications=password',
        'root@192.168.1.50',
        'bash -s',
      ]);
      expect(result.password).toBe('mySecretPass');
    });

    test('should generate SSH command with password and custom port', () => {
      const result = generateSSHCommandWithPwd({
        userName: 'admin',
        host: 'server.example.com',
        password: 'P@ssw0rd!',
        port: 2222,
      });

      expect(result.command).toEqual([
        'ssh',
        '-o',
        'PubkeyAuthentication=no',
        '-o',
        'PreferredAuthentications=password',
        '-p',
        '2222',
        'admin@server.example.com',
        'bash -s',
      ]);
      expect(result.password).toBe('P@ssw0rd!');
    });

    test('should not add port flag when port is 22', () => {
      const result = generateSSHCommandWithPwd({
        userName: 'user',
        host: '10.0.0.1',
        password: 'test123',
        port: 22,
      });

      expect(result.command).not.toContain('-p');
      expect(result.command).not.toContain('22');
    });

    test('should preserve password in return value', () => {
      const password = 'verySecretPassword123!@#';
      const result = generateSSHCommandWithPwd({
        userName: 'ubuntu',
        host: 'ec2.amazonaws.com',
        password,
      });

      expect(result.password).toBe(password);
      expect(result.password).toBe('verySecretPassword123!@#');
    });

    test('should include correct SSH options for password auth', () => {
      const result = generateSSHCommandWithPwd({
        userName: 'deploy',
        host: 'staging.server.io',
        password: 'deploy123',
      });

      expect(result.command).toContain('PubkeyAuthentication=no');
      expect(result.command).toContain('PreferredAuthentications=password');
    });

    test('should handle IPv4 addresses', () => {
      const result = generateSSHCommandWithPwd({
        userName: 'root',
        host: '203.0.113.42',
        password: 'rootpass',
        port: 3333,
      });

      expect(result.command).toContain('root@203.0.113.42');
      expect(result.command).toContain('-p');
      expect(result.command).toContain('3333');
    });
  });
});
