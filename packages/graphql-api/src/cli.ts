import * as fs from 'node:fs';
import * as path from 'node:path';
import * as typescriptPlugin from '@graphql-codegen/typescript';
import { codegen } from '@graphql-codegen/core';
import { hideBin } from 'yargs/helpers';
import { parse } from 'graphql';
import { register } from 'ts-node';
import { register as registerTsPaths } from 'tsconfig-paths';
import log from 'npmlog';
import yargs from 'yargs';

const logPrefix = 'graphql-api';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const tsConfig = require(path.resolve(process.cwd(), 'tsconfig.json'));
try {
  const baseUrl = tsConfig.compilerOptions.baseUrl;
  const paths = tsConfig.compilerOptions.paths;
  if (!baseUrl || !paths) {
    throw new Error(
      "tsconfig.json must have 'baseUrl' and 'paths' properties."
    );
  }
} catch (error: unknown) {
  error instanceof Error && log.error(logPrefix, error.message);
  process.exit(1);
}

const cleanup = registerTsPaths({
  baseUrl: tsConfig.compilerOptions.baseUrl,
  paths: tsConfig.compilerOptions.paths,
});
register({
  transpileOnly: true,
  compilerOptions: {
    module: 'NodeNext',
    moduleResolution: 'NodeNext',
  },
});

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

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { schemaComposer } = require(
    path.resolve(process.cwd(), directory, 'schemaComposer.ts')
  );

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
  cleanup();
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
