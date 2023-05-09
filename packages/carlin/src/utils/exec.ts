import childProcess from 'child_process';
import log from 'npmlog';

log.heading = 'exec';

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
