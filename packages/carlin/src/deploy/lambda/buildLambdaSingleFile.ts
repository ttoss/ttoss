import * as esbuild from 'esbuild';
import { typescriptConfig } from '@ttoss/config';
import builtins from 'builtin-modules';
import log from 'npmlog';
import path from 'path';

const logPrefix = 'lambda';

export const outFolder = 'dist';

export const outFile = 'index.js';

export const buildLambdaSingleFile = async ({
  lambdaExternals,
  lambdaInput,
}: {
  lambdaExternals: string[];
  lambdaInput: string;
}) => {
  log.info(logPrefix, 'Building Lambda single file...');

  const { errors } = esbuild.buildSync({
    banner: {
      js: '// Powered by carlin (https://ttoss.dev/docs/carlin/)',
    },
    bundle: true,
    entryPoints: [path.resolve(process.cwd(), lambdaInput)],
    external: [
      /**
       * Only AWS SDK v3 on Node.js 18.x or higher.
       * https://aws.amazon.com/blogs/compute/node-js-18-x-runtime-now-available-in-aws-lambda/
       */
      '@aws-sdk/*',
      ...builtins,
      ...lambdaExternals,
    ],
    /**
     * Some packages as `graphql` are not compatible with ESM yet.
     * https://github.com/graphql/graphql-js/issues/3603
     */
    format: 'cjs',
    /**
     * https://esbuild.github.io/api/#minify
     */
    minifySyntax: true,
    platform: 'node',
    outfile: path.join(process.cwd(), outFolder, outFile),
    target: typescriptConfig.target,
    treeShaking: true,
  });

  if (errors.length > 0) {
    throw errors;
  }
};
