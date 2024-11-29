import * as esbuild from 'esbuild';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as typescriptPlugin from '@graphql-codegen/typescript';
import { codegen } from '@graphql-codegen/core';
import { hideBin } from 'yargs/helpers';
import { parse } from 'graphql';
import log from 'npmlog';
import yargs from 'yargs';

const logPrefix = 'graphql-api';

export const importSchemaComposer = async (schemaComposerPath: string) => {
  const lastEntryPointName = schemaComposerPath.split('/').pop();

  const filename = lastEntryPointName?.split('.')[0] as string;

  const outfile = path.resolve(process.cwd(), 'out', filename + '.js');

  const result = await esbuild.build({
    bundle: true,
    entryPoints: [schemaComposerPath],
    external: [],
    format: 'esm',
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
    return await import(outfile);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed importing build config file: ', filename);
    throw error;
  }
};

const buildSchema = async ({ directory }: { directory: string }) => {
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

  const { schemaComposer } = await importSchemaComposer(schemaComposerPath);

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

  // cleanup();

  log.info(logPrefix, 'Schema and types generated!');
};

yargs(hideBin(process.argv))
  .command(
    'build-schema',
    'fetch the contents of the URL',
    (yargs) => {
      return yargs.options({
        directory: {
          alias: ['d'],
          type: 'string',
          describe: 'Schema composer directory relative to the project root',
          default: 'src',
        },
      });
    },
    (argv) => {
      return buildSchema(argv);
    }
  )
  .demandCommand(1)
  .strictOptions()
  .parse();
