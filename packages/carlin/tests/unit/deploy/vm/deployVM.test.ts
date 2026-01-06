/* eslint-disable @typescript-eslint/no-explicit-any */

jest.mock('node:child_process');
jest.mock('node:fs');
jest.mock('../../../../src/deploy/vm/VMconnection');

import { spawn } from 'node:child_process';
import { chmodSync, createReadStream, existsSync, statSync } from 'node:fs';

import { deployVM } from '../../../../src/deploy/vm/deployVM';
import * as VMconnection from '../../../../src/deploy/vm/VMconnection';

describe('deployVM', () => {
  const mockSpawn = spawn as jest.MockedFunction<typeof spawn>;
  const mockExistsSync = existsSync as jest.MockedFunction<typeof existsSync>;
  const mockStatSync = statSync as jest.MockedFunction<typeof statSync>;
  const mockCreateReadStream = createReadStream as jest.MockedFunction<
    typeof createReadStream
  >;
  const mockChmodSync = chmodSync as jest.MockedFunction<typeof chmodSync>;
  const mockGenerateSSHCommand =
    VMconnection.generateSSHCommand as jest.MockedFunction<
      typeof VMconnection.generateSSHCommand
    >;
  const mockGenerateSSHCommandWithPwd =
    VMconnection.generateSSHCommandWithPwd as jest.MockedFunction<
      typeof VMconnection.generateSSHCommandWithPwd
    >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should throw error if required parameters are missing', async () => {
    await expect(
      deployVM({
        userName: '',
        host: 'host',
        scriptPath: '/path/script.sh',
      })
    ).rejects.toThrow('Missing required parameters');
  });

  test('should throw error if neither keyPath nor password is provided', async () => {
    await expect(
      deployVM({
        userName: 'user',
        host: 'host',
        scriptPath: '/path/script.sh',
      })
    ).rejects.toThrow('Authentication method required');
  });

  test('should throw error if SSH key does not exist', async () => {
    mockExistsSync.mockReturnValue(false);

    await expect(
      deployVM({
        userName: 'user',
        host: 'host',
        scriptPath: '/path/script.sh',
        keyPath: '/nonexistent/key.pem',
      })
    ).rejects.toThrow('SSH key not found');
  });

  test('should deploy successfully with valid SSH key', async () => {
    mockExistsSync.mockReturnValue(true);
    mockStatSync.mockReturnValue({ mode: 0o100400 } as any);

    const mockStdin = {
      write: jest.fn(),
      writable: true,
      destroyed: false,
      pipe: jest.fn(),
    };

    const mockProcess: any = {
      stdin: mockStdin,
      on: jest.fn((event: string, callback: (code: number) => void) => {
        if (event === 'close') callback(0);
        return mockProcess;
      }),
      kill: jest.fn(),
    };
    mockSpawn.mockReturnValue(mockProcess);

    const mockStream = {
      pipe: jest.fn(),
    };
    mockCreateReadStream.mockReturnValue(mockStream as any);

    mockGenerateSSHCommand.mockReturnValue([
      'ssh',
      '-T',
      'user@host',
      'bash -s',
    ]);

    await expect(
      deployVM({
        userName: 'user',
        host: 'host',
        scriptPath: '/path/script.sh',
        keyPath: '/valid/key.pem',
      })
    ).resolves.toBeUndefined();

    expect(mockStream.pipe).toHaveBeenCalledWith(mockStdin);
    expect(mockGenerateSSHCommand).toHaveBeenCalledWith({
      userName: 'user',
      host: 'host',
      keyPath: '/valid/key.pem',
      port: undefined,
    });
  });

  test('should deploy successfully with password', async () => {
    const mockStdin = {
      write: jest.fn(),
      writable: true,
      destroyed: false,
      pipe: jest.fn(),
    };

    const mockProcess: any = {
      stdin: mockStdin,
      on: jest.fn((event: string, callback: (code: number) => void) => {
        if (event === 'close') callback(0);
        return mockProcess;
      }),
      kill: jest.fn(),
    };
    mockSpawn.mockReturnValue(mockProcess);

    const mockStream = {
      pipe: jest.fn(),
    };
    mockCreateReadStream.mockReturnValue(mockStream as any);

    mockGenerateSSHCommandWithPwd.mockReturnValue({
      command: [
        'ssh',
        '-o',
        'PubkeyAuthentication',
        '-o',
        'PreferredAuthentications=password',
        'user@host',
      ],
      password: 'mypassword',
    });

    await expect(
      deployVM({
        userName: 'user',
        host: 'host',
        scriptPath: '/path/script.sh',
        password: 'mypassword',
      })
    ).resolves.toBeUndefined();

    expect(mockStdin.write).toHaveBeenCalledWith('mypassword\n');
    expect(mockStream.pipe).toHaveBeenCalledWith(mockStdin);
    expect(mockGenerateSSHCommandWithPwd).toHaveBeenCalledWith({
      userName: 'user',
      host: 'host',
      password: 'mypassword',
      port: undefined,
    });
  });

  test('should fix SSH key permissions when fixPermissions is true', async () => {
    mockExistsSync.mockReturnValue(true);
    mockStatSync.mockReturnValue({ mode: 0o100644 } as any);

    const mockStdin = {
      write: jest.fn(),
      writable: true,
      destroyed: false,
      pipe: jest.fn(),
    };

    const mockProcess: any = {
      stdin: mockStdin,
      on: jest.fn((event: string, callback: (code: number) => void) => {
        if (event === 'close') callback(0);
        return mockProcess;
      }),
      kill: jest.fn(),
    };
    mockSpawn.mockReturnValue(mockProcess);

    const mockStream = {
      pipe: jest.fn(),
    };
    mockCreateReadStream.mockReturnValue(mockStream as any);

    mockGenerateSSHCommand.mockReturnValue(['ssh', 'user@host']);

    await deployVM({
      userName: 'user',
      host: 'host',
      scriptPath: '/path/script.sh',
      keyPath: '/key.pem',
      fixPermissions: true,
    });

    expect(mockChmodSync).toHaveBeenCalledWith('/key.pem', 0o400);
    expect(mockStream.pipe).toHaveBeenCalledWith(mockStdin);
  });

  test('should handle SSH process spawn error', async () => {
    mockExistsSync.mockReturnValue(true);
    mockStatSync.mockReturnValue({ mode: 0o100400 } as any);

    const mockProcess: any = {
      stdin: { writable: true, destroyed: false },
      on: jest.fn((event: string, callback: (error: Error) => void) => {
        if (event === 'error') {
          callback(new Error('spawn ENOENT'));
        }
        return mockProcess;
      }),
    };
    mockSpawn.mockReturnValue(mockProcess);

    mockGenerateSSHCommand.mockReturnValue(['ssh', 'user@host']);

    await expect(
      deployVM({
        userName: 'user',
        host: 'host',
        scriptPath: '/path/script.sh',
        keyPath: '/key.pem',
      })
    ).rejects.toThrow('spawn ENOENT');
  });

  test('should reject when SSH process closes with non-zero code', async () => {
    mockExistsSync.mockReturnValue(true);
    mockStatSync.mockReturnValue({ mode: 0o100400 } as any);

    const mockStdin = { write: jest.fn(), writable: true, destroyed: false };
    const mockProcess: any = {
      stdin: mockStdin,
      on: jest.fn((event: string, callback: (code: number) => void) => {
        if (event === 'close') callback(255);
        return mockProcess;
      }),
    };
    mockSpawn.mockReturnValue(mockProcess);

    const mockStream = { pipe: jest.fn() };
    mockCreateReadStream.mockReturnValue(mockStream as any);

    mockGenerateSSHCommand.mockReturnValue(['ssh', 'user@host']);

    await expect(
      deployVM({
        userName: 'user',
        host: 'host',
        scriptPath: '/path/script.sh',
        keyPath: '/key.pem',
      })
    ).rejects.toThrow('Deploy failed with code 255');
  });

  test('should reject when SSH process stdin is null', async () => {
    mockExistsSync.mockReturnValue(true);
    mockStatSync.mockReturnValue({ mode: 0o100400 } as any);

    const mockProcess: any = {
      stdin: null,
      on: jest.fn(),
    };
    mockSpawn.mockReturnValue(mockProcess);

    mockGenerateSSHCommand.mockReturnValue(['ssh', 'user@host']);

    await expect(
      deployVM({
        userName: 'user',
        host: 'host',
        scriptPath: '/path/script.sh',
        keyPath: '/key.pem',
      })
    ).rejects.toThrow('SSH process stdin is not available or not writable');
  });

  test('should reject when SSH process stdin is destroyed', async () => {
    mockExistsSync.mockReturnValue(true);
    mockStatSync.mockReturnValue({ mode: 0o100400 } as any);

    const mockStdin = { writable: true, destroyed: true };
    const mockProcess: any = {
      stdin: mockStdin,
      on: jest.fn(),
    };
    mockSpawn.mockReturnValue(mockProcess);

    mockGenerateSSHCommand.mockReturnValue(['ssh', 'user@host']);

    await expect(
      deployVM({
        userName: 'user',
        host: 'host',
        scriptPath: '/path/script.sh',
        keyPath: '/key.pem',
      })
    ).rejects.toThrow('SSH process stdin is not available or not writable');
  });

  test('should reject when SSH process stdin is not writable', async () => {
    mockExistsSync.mockReturnValue(true);
    mockStatSync.mockReturnValue({ mode: 0o100400 } as any);

    const mockStdin = { writable: false, destroyed: false };
    const mockProcess: any = {
      stdin: mockStdin,
      on: jest.fn(),
    };
    mockSpawn.mockReturnValue(mockProcess);

    mockGenerateSSHCommand.mockReturnValue(['ssh', 'user@host']);

    await expect(
      deployVM({
        userName: 'user',
        host: 'host',
        scriptPath: '/path/script.sh',
        keyPath: '/key.pem',
      })
    ).rejects.toThrow('SSH process stdin is not available or not writable');
  });

  test('should warn but continue when permission check fails for other reasons', async () => {
    mockExistsSync.mockReturnValue(true);
    mockStatSync.mockImplementation(() => {
      throw new Error('EACCES: permission denied');
    });

    const mockStdin = { write: jest.fn(), writable: true, destroyed: false };
    const mockProcess: any = {
      stdin: mockStdin,
      on: jest.fn((event: string, callback: (code: number) => void) => {
        if (event === 'close') callback(0);
        return mockProcess;
      }),
    };
    mockSpawn.mockReturnValue(mockProcess);

    const mockStream = { pipe: jest.fn() };
    mockCreateReadStream.mockReturnValue(mockStream as any);

    mockGenerateSSHCommand.mockReturnValue(['ssh', 'user@host']);

    // Should NOT throw, only warn
    await expect(
      deployVM({
        userName: 'user',
        host: 'host',
        scriptPath: '/path/script.sh',
        keyPath: '/key.pem',
      })
    ).resolves.toBeUndefined();
  });

  test('should cleanup SIGINT handler after successful deployment', async () => {
    mockExistsSync.mockReturnValue(true);
    mockStatSync.mockReturnValue({ mode: 0o100400 } as any);

    const mockStdin = {
      write: jest.fn(),
      writable: true,
      destroyed: false,
      pipe: jest.fn(),
    };

    const mockProcess: any = {
      stdin: mockStdin,
      on: jest.fn((event: string, callback: (code: number) => void) => {
        if (event === 'close') callback(0);
        return mockProcess;
      }),
      kill: jest.fn(),
    };
    mockSpawn.mockReturnValue(mockProcess);

    const mockStream = { pipe: jest.fn() };
    mockCreateReadStream.mockReturnValue(mockStream as any);

    mockGenerateSSHCommand.mockReturnValue(['ssh', 'user@host']);

    // Track SIGINT listeners
    const initialListenerCount = process.listenerCount('SIGINT');

    await deployVM({
      userName: 'user',
      host: 'host',
      scriptPath: '/path/script.sh',
      keyPath: '/key.pem',
    });

    // Verify listener was cleaned up
    const finalListenerCount = process.listenerCount('SIGINT');
    expect(finalListenerCount).toBe(initialListenerCount);
  });

  test('should cleanup SIGINT handler after failed deployment', async () => {
    mockExistsSync.mockReturnValue(true);
    mockStatSync.mockReturnValue({ mode: 0o100400 } as any);

    const mockStdin = { write: jest.fn(), writable: true, destroyed: false };
    const mockProcess: any = {
      stdin: mockStdin,
      on: jest.fn((event: string, callback: (code: number) => void) => {
        if (event === 'close') callback(1);
        return mockProcess;
      }),
      kill: jest.fn(),
    };
    mockSpawn.mockReturnValue(mockProcess);

    const mockStream = { pipe: jest.fn() };
    mockCreateReadStream.mockReturnValue(mockStream as any);

    mockGenerateSSHCommand.mockReturnValue(['ssh', 'user@host']);

    // Track SIGINT listeners
    const initialListenerCount = process.listenerCount('SIGINT');

    await expect(
      deployVM({
        userName: 'user',
        host: 'host',
        scriptPath: '/path/script.sh',
        keyPath: '/key.pem',
      })
    ).rejects.toThrow('Deploy failed with code 1');

    // Verify listener was cleaned up even on failure
    const finalListenerCount = process.listenerCount('SIGINT');
    expect(finalListenerCount).toBe(initialListenerCount);
  });

  test('should cleanup SIGINT handler after SSH process error', async () => {
    mockExistsSync.mockReturnValue(true);
    mockStatSync.mockReturnValue({ mode: 0o100400 } as any);

    const mockProcess: any = {
      stdin: { writable: true, destroyed: false },
      on: jest.fn((event: string, callback: (error: Error) => void) => {
        if (event === 'error') {
          callback(new Error('SSH connection failed'));
        }
        return mockProcess;
      }),
      kill: jest.fn(),
    };
    mockSpawn.mockReturnValue(mockProcess);

    mockGenerateSSHCommand.mockReturnValue(['ssh', 'user@host']);

    // Track SIGINT listeners
    const initialListenerCount = process.listenerCount('SIGINT');

    await expect(
      deployVM({
        userName: 'user',
        host: 'host',
        scriptPath: '/path/script.sh',
        keyPath: '/key.pem',
      })
    ).rejects.toThrow('SSH connection failed');

    // Verify listener was cleaned up even on error
    const finalListenerCount = process.listenerCount('SIGINT');
    expect(finalListenerCount).toBe(initialListenerCount);
  });
});
