import childProcess from 'node:child_process';
import { stdout } from 'node:process';

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
