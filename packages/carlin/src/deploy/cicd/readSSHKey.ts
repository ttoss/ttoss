import * as fs from 'fs';

/**
 * Created to allow mocking.
 */
export const readSSHKey = (dir: string) => {
  return fs.readFileSync(dir, 'utf-8');
};
