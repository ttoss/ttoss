import * as fs from 'fs';
import * as path from 'path';

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
