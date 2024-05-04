import * as esbuild from 'esbuild';
import { typescriptConfig } from '@ttoss/config';
import importSync from 'import-sync';
import path from 'node:path';

export const loadConfig = <T>(entryPoint: string): T | undefined => {
  const lastEntryPointName = entryPoint.split('/').pop();

  const filename = lastEntryPointName?.split('.')[0] as string;

  const outfile = path.resolve(process.cwd(), 'out', filename + '.js');

  const projectPackageJsonPath = path.resolve(process.cwd(), 'package.json');

  const projectPackageJson = importSync(projectPackageJsonPath);

  const projectDependencies = Object.keys(
    projectPackageJson.dependencies || {}
  );

  const result = esbuild.buildSync({
    bundle: true,
    entryPoints: [entryPoint],
    external: projectDependencies,
    format: 'cjs',
    outfile,
    platform: 'node',
    target: typescriptConfig.target,
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
