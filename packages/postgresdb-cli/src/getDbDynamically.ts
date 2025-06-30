import 'dotenv/config';

import * as builtinModules from 'node:module';
import path from 'node:path';

import * as esbuild from 'esbuild';

// Get all Node.js built-in modules - using the modern approach
const nodeBuiltins = builtinModules.builtinModules;

export const getDbDynamically = async ({ dbPath }: { dbPath: string }) => {
  const lastEntryPointName = dbPath.split('/').pop();
  const filename = lastEntryPointName?.split('.')[0] as string;
  const outfile = path.resolve(process.cwd(), 'out', filename + '.js');
  const entryPoint = path.resolve(process.cwd(), dbPath);

  const result = esbuild.buildSync({
    bundle: true,
    entryPoints: [entryPoint],
    external: ['@ttoss/postgresdb', ...nodeBuiltins],
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
