import * as fs from 'node:fs';
import * as path from 'node:path';
import * as typescriptPlugin from '@graphql-codegen/typescript';
import { codegen } from '@graphql-codegen/core';
import { parse } from 'graphql';
import { register } from 'ts-node';
import log from 'npmlog';
import yargs from 'yargs';

const logPrefix = 'graphql-api';

register({
  transpileOnly: true,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const argv: any = yargs(process.argv.slice(2)).argv;

(async () => {
  if (argv._.includes('build-schema')) {
    log.info(logPrefix, 'Building schema...');

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { schemaComposer } = require(path.resolve(
      process.cwd(),
      'src',
      'schemaComposer.ts'
    ));

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

    /**
     * Save to schema/schema.graphql. schema folder might not exist.
     */
    await fs.promises.mkdir('schema', { recursive: true });

    await fs.promises.writeFile('schema/schema.graphql', sdl);

    const typesOutput = await codegen(codegenConfig);

    const typesOutputIgnore = ['/* eslint-disable */'].join('\n');

    await fs.promises.writeFile(
      'schema/types.ts',
      `${typesOutputIgnore}\n${typesOutput}`
    );

    log.info(logPrefix, 'Schema and types generated!');
  }
})();
