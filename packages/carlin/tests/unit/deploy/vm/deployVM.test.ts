/* eslint-disable @typescript-eslint/no-explicit-any */
import { spawn } from 'node:child_process';
import { chmodSync, createReadStream, existsSync, statSync } from 'node:fs';

import { deployVM } from '../../../../src/deploy/vm/deployVM';
import * as VMconnection from '../../../../src/deploy/vm/VMconnection';

jest.mock('node:child_process');
jest.mock('node:fs');
jest.mock('npmlog');

describe('deployVM', () => {
  const mockSpawn = spawn as jest.MockedFunction<typeof spawn>;
  const mockExistsSync = existsSync as jest.MockedFunction<typeof existsSync>;
  const mockStatSync = statSync as jest.MockedFunction<typeof statSync>;
  const mockCreateReadStream = createReadStream as jest.MockedFunction<
    typeof createReadStream
  >;
  const mockChmodSync = chmodSync as jest.MockedFunction<typeof chmodSync>;

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

    // Mock createReadStream
    const mockStream = {
      pipe: jest.fn(),
    };
    mockCreateReadStream.mockReturnValue(mockStream as any);

    jest
      .spyOn(VMconnection, 'generateSSHCommand')
      .mockReturnValue(['ssh', '-T', 'user@host', 'bash -s']);

    await expect(
      deployVM({
        userName: 'user',
        host: 'host',
        scriptPath: '/path/script.sh',
        keyPath: '/valid/key.pem',
      })
    ).resolves.toBeUndefined();

    expect(mockStream.pipe).toHaveBeenCalledWith(mockStdin);
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

    // Mock createReadStream
    const mockStream = {
      pipe: jest.fn(),
    };
    mockCreateReadStream.mockReturnValue(mockStream as any);

    jest.spyOn(VMconnection, 'generateSSHCommandWithPwd').mockReturnValue({
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

    // Mock createReadStream
    const mockStream = {
      pipe: jest.fn(),
    };
    mockCreateReadStream.mockReturnValue(mockStream as any);

    jest
      .spyOn(VMconnection, 'generateSSHCommand')
      .mockReturnValue(['ssh', 'user@host']);

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
});
