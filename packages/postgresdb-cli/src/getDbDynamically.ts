import 'dotenv/config';

import * as esbuild from 'esbuild';
import path from 'node:path';

export const getDbDynamically = async ({ dbPath }: { dbPath: string }) => {
  const lastEntryPointName = dbPath.split('/').pop();
  const filename = lastEntryPointName?.split('.')[0] as string;
  const outfile = path.resolve(process.cwd(), 'out', filename + '.js');
  const entryPoint = path.resolve(process.cwd(), dbPath);

  const result = esbuild.buildSync({
    bundle: true,
    entryPoints: [entryPoint],
    /**
     * ttoss packages cannot be market as external because it'd break the CI.
     * On CI, ttoss packages point to the TS main file, not the compiled
     * ones. See more details here https://github.com/ttoss/ttoss/issues/541.
     */
    external: ['pg', 'sequelize', 'sequelize-typescript'],
    format: 'esm',
    outfile,
    platform: 'node',
    target: 'esnext',
    treeShaking: true,
  });

  if (result.errors.length > 0) {
    // eslint-disable-next-line no-console
    console.error('Error building config file: ', filename);
    throw result.errors;
  }

  const { db } = await import(outfile);

  return db;
};
