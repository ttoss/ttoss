/* eslint-disable @typescript-eslint/no-explicit-any */
import childProcess from 'node:child_process';

import * as execModule from './exec';

jest.mock('child_process');

describe('testing exec', () => {
  const command = 'command';

  test('should return error', async () => {
    const error = 'error';

    (childProcess.exec as any).mockImplementation(
      (_cmd: string, callback: any) => {
        callback(error, null, null);
      }
    );

    try {
      await execModule.exec('command');
    } catch (error_) {
      expect(error_).toEqual(error);
      expect(childProcess.exec).toHaveBeenCalledWith(
        command,
        expect.any(Function)
      );
    }
  });

  test('should return stdout', async () => {
    const stdout = 'stdout';

    (childProcess.exec as any).mockImplementation(
      (_cmd: string, callback: any) => {
        callback(null, stdout, null);
      }
    );

    const out = await execModule.exec('command');
    expect(out).toEqual(stdout);
    expect(childProcess.exec).toHaveBeenCalledWith(
      command,
      expect.any(Function)
    );
  });

  test('should return stderr', async () => {
    const stderr = 'stderr';

    (childProcess.exec as any).mockImplementation(
      (_cmd: string, callback: any) => {
        callback(null, null, stderr);
      }
    );

    try {
      await execModule.exec('command');
    } catch (error) {
      expect(error).toEqual(stderr);
      expect(childProcess.exec).toHaveBeenCalledWith(
        command,
        expect.any(Function)
      );
    }
  });

  test('should return no error when error, stdout and stderr are undefined', async () => {
    (childProcess.exec as any).mockImplementation(
      (_cmd: string, callback: any) => {
        callback(null, null, null);
      }
    );

    const out = await execModule.exec('command');

    expect(out).toBeUndefined();
    expect(childProcess.exec).toHaveBeenCalledWith(
      command,
      expect.any(Function)
    );
  });
});
