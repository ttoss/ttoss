import * as fs from 'node:fs';

/**
 * Created to allow mocking.
 */
export const readSSHKey = (dir: string) => {
  return fs.readFileSync(dir, 'utf-8');
};
