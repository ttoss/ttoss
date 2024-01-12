import * as esbuild from 'esbuild';
import builtins from 'builtin-modules';
import log from 'npmlog';
import path from 'path';

const logPrefix = 'lambda';

const outFolder = 'dist';

const outFile = 'index.js';

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
     * https://esbuild.github.io/api/#minify
     */
    minifySyntax: true,
    platform: 'node',
    outfile: path.join(process.cwd(), outFolder, outFile),
    target: 'node20',
    treeShaking: true,
  });

  if (errors.length > 0) {
    throw errors;
  }
};
