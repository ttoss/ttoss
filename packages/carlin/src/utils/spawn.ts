import { stdout } from 'process';
import childProcess from 'child_process';
import log from 'npmlog';

log.heading = 'exec';

export const spawn = (cmd: string) => {
  return new Promise((resolve, reject) => {
    const [cmdName, ...cmdArgs] = cmd.split(' ');

    const child = childProcess.spawn(cmdName, cmdArgs);

    child.stdout.on('data', (data) => {
      stdout.write(data);
    });

    child.stderr.on('data', (data) => {
      stdout.write(data);
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({});
      } else {
        reject(code);
      }
    });
  });
};
