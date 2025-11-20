import * as builtinModules from 'node:module';
import path from 'node:path';

import { config } from 'dotenv';
import * as esbuild from 'esbuild';

// Get all Node.js built-in modules - using the modern approach
const nodeBuiltins = builtinModules.builtinModules;

export const getDbDynamically = async ({
  dbPath,
  environment,
}: {
  dbPath: string;
  environment?: string;
}) => {
  // Load environment-specific .env file if environment is provided
  if (environment) {
    const envPath = path.resolve(process.cwd(), `.env.${environment}`);
    config({ path: envPath, override: true });
    // eslint-disable-next-line no-console
    console.info(`Loaded environment variables from .env.${environment}`);
  }

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
