import * as esbuild from 'esbuild';
import importSync from 'import-sync';
import path from 'node:path';

export const loadConfig = <T>(entryPoint: string): T | undefined => {
  const lastEntryPointName = entryPoint.split('/').pop();

  const filename = lastEntryPointName?.split('.')[0] as string;

  const outfile = path.resolve(process.cwd(), 'out', filename + '.js');

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
    const config = importSync(outfile);
    return (config.default || config.config) as T;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed importing build config file: ', filename);
    throw error;
  }
};
