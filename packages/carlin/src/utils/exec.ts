import childProcess from 'node:child_process';

export const exec = (cmd: string) => {
  return new Promise((resolve, reject) => {
    childProcess.exec(cmd, (error, stdout, stderr) => {
      if (error) {
        return reject(error);
      }

      if (stdout) {
        return resolve(stdout);
      }

      if (stderr) {
        return reject(stderr);
      }

      return resolve(undefined);
    });
  });
};
