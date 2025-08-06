import * as fs from 'node:fs';
import * as path from 'node:path';

import { codegen } from '@graphql-codegen/core';
import * as typescriptPlugin from '@graphql-codegen/typescript';
import { Command } from 'commander';
import * as esbuild from 'esbuild';
import { parse } from 'graphql';
import log from 'npmlog';

import pkg from '../package.json';

const logPrefix = 'graphql-api';

const importSchemaComposer = async ({
  external = [],
  schemaComposerPath,
}: {
  external?: string[];
  schemaComposerPath: string;
}) => {
  const lastEntryPointName = schemaComposerPath.split('/').pop();

  const filename = lastEntryPointName?.split('.')[0] as string;

  const outfile = path.resolve(process.cwd(), 'out', filename + '.js');

  const packageJsonPath = path.resolve(process.cwd(), 'package.json');

  const getPackageDependencies = (packageJsonPath: string) => {
    const packageJson = fs.readFileSync(packageJsonPath, 'utf-8');
    const parsedPackageJson = JSON.parse(packageJson);

    const dependencies: string[] = [];

    for (const [dependency, version] of Object.entries<string>(
      parsedPackageJson.dependencies || {}
    )) {
      /**
       * Avoid issue:
       * Error: Dynamic require of "graphql" is not supported
       */
      if (dependency === 'graphql') {
        continue;
      }

      if (version.startsWith('file:')) {
        continue; // Ignore local file dependencies
      }

      /**
       * Ignore workspace dependencies. This is useful in monorepos because
       * those dependencies may export a ".ts" file and "import" will fail
       * with the error 'Unknown file extension ".ts"'.
       */
      if (version.startsWith('workspace:')) {
        continue;
      }

      dependencies.push(dependency);
    }

    return dependencies;
  };

  const dependencies = getPackageDependencies(packageJsonPath)
    // Remove duplicates
    .filter((dep, index, self) => {
      return self.indexOf(dep) === index;
    })
    .sort((a, b) => {
      return a.localeCompare(b);
    });

  const result = await esbuild.build({
    bundle: true,
    entryPoints: [schemaComposerPath],
    external: [...external, ...dependencies],
    format: 'esm',
    outfile,
    platform: 'node',
    target: 'ES2023',
    treeShaking: true,
  });

  if (result.errors.length > 0) {
    // eslint-disable-next-line no-console
    console.error('Error building config file: ', filename);
    throw result.errors;
  }

  try {
    return await import(outfile);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed importing build config file: ', filename);
    throw error;
  }
};

const buildSchema = async ({
  directory,
  external,
}: {
  directory: string;
  external?: string[];
}) => {
  log.info(logPrefix, 'Building schema...');

  await fs.promises.mkdir('schema', { recursive: true });

  /**
   * Create schema/types.ts if it doesn't exist. We need to do this because
   * graphql-codegen will throw an error if the file doesn't exist and the
   * code import the types from that file.
   */
  try {
    await fs.promises.access('schema/types.ts');
  } catch {
    await fs.promises.writeFile('schema/types.ts', '');
  }

  const schemaComposerPath = path.resolve(
    process.cwd(),
    directory,
    'schemaComposer.ts'
  );

  const { schemaComposer } = await importSchemaComposer({
    external,
    schemaComposerPath,
  });

  const sdl = schemaComposer.toSDL();

  /**
   * https://the-guild.dev/graphql/codegen/docs/advanced/programmatic-usage
   */
  const codegenConfig = {
    documents: [],
    config: {
      declarationKind: {
        type: 'interface',
        interface: 'interface',
      },
      namingConvention: 'keep',
    },
    filename: 'schema/types.ts',
    schema: parse(sdl),
    plugins: [
      {
        typescript: {},
      },
    ],
    pluginMap: {
      typescript: typescriptPlugin,
    },
  };

  await fs.promises.writeFile('schema/schema.graphql', sdl);

  log.info(logPrefix, 'Generating types...');

  const typesOutput = await codegen(codegenConfig);

  const typesOutputIgnore = ['/* eslint-disable */'].join('\n');

  await fs.promises.writeFile(
    'schema/types.ts',
    `${typesOutputIgnore}\n${typesOutput}`
  );

  log.info(logPrefix, 'Schema and types generated!');
};

const program = new Command();

program
  .name('ttoss-graphql-api')
  .version(
    pkg.version,
    '-v, --version',
    'Output the current version of the GraphQL API'
  );

program
  .command('build-schema')
  .option('-d, --directory <directory>', 'Schema composer directory', 'src')
  .option(
    '--external <external...>',
    'External dependencies to ignore during build'
  )
  .action((options) => {
    return buildSchema(options);
  });

program.parse(process.argv);
