import * as builtinModules from 'node:module';
import path from 'node:path';

import { config } from 'dotenv';
import * as esbuild from 'esbuild';

// Get all Node.js built-in modules - using the modern approach
const nodeBuiltins = builtinModules.builtinModules;

/**
 * Bundles a TypeScript file from the project and imports it, so the CLI can
 * read the project's own `db` or `migrations` without the project building
 * first. `@ttoss/postgresdb` stays external so the bundle and the project share
 * one Sequelize instance.
 */
export const loadModuleDynamically = async <T = Record<string, unknown>>({
  modulePath,
  environment,
}: {
  modulePath: string;
  environment?: string;
}): Promise<T> => {
  // Load environment-specific .env file if environment is provided
  if (environment) {
    const envPath = path.resolve(process.cwd(), `.env.${environment}`);
    config({ path: envPath, override: true });
    // eslint-disable-next-line no-console
    console.info(`Loaded environment variables from .env.${environment}`);
  }

  const lastEntryPointName = modulePath.split('/').pop();
  const filename = lastEntryPointName?.split('.')[0] as string;
  const outfile = path.resolve(process.cwd(), 'out', filename + '.js');
  const entryPoint = path.resolve(process.cwd(), modulePath);

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

  return import(outfile);
};
