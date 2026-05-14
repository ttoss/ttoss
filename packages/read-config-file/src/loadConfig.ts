import crypto from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

import * as esbuild from 'esbuild';

const nodeRequire = createRequire(import.meta.url);

export const loadConfig = <T>(entryPoint: string): T | undefined => {
  const lastEntryPointName = entryPoint.split('/').pop();

  const filename = lastEntryPointName?.split('.')[0] as string;

  const entryFileContent = fs.readFileSync(entryPoint, 'utf8');
  const entryFileHash = crypto
    .createHash('sha1')
    .update(entryFileContent)
    .digest('hex')
    .slice(0, 8);
  const outfile = path.resolve(
    process.cwd(),
    'out',
    `${filename}-${entryFileHash}.js`
  );

  const result = esbuild.buildSync({
    bundle: true,
    entryPoints: [entryPoint],
    /**
     * ttoss packages cannot be market as external because it'd break the CI.
     * On CI, ttoss packages point to the TS main file, not the compiled
     * ones. See more details here https://github.com/ttoss/ttoss/issues/541.
     */
    external: [],
    format: 'cjs',
    outfile,
    platform: 'node',
    target: 'ES2021',
    treeShaking: true,
  });

  if (result.errors.length > 0) {
    // eslint-disable-next-line no-console
    console.error('Error building config file: ', filename);
    throw result.errors;
  }

  try {
    // Ensure the generated config file is reloaded on subsequent calls.
    const resolvedOutfile = nodeRequire.resolve(outfile);
    delete nodeRequire.cache[resolvedOutfile];
    const config = nodeRequire(resolvedOutfile);
    return (config.default || config.config) as T;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed importing build config file: ', filename);
    throw error;
  }
};
