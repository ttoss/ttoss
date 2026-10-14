import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * This method was created because fs.readFileSync cannot be mocked.
 */
export const readDockerfile = (dockerfilePath: string) => {
  try {
    return fs.readFileSync(path.join(process.cwd(), dockerfilePath), 'utf8');
  } catch {
    return '';
  }
};
