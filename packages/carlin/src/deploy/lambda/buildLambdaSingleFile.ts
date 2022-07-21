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
      js: '// Powered by carlin (https://ttoss.dev)',
    },
    bundle: true,
    entryPoints: [path.resolve(process.cwd(), lambdaInput)],
    external: ['aws-sdk', ...builtins, ...lambdaExternals],
    platform: 'node',
    outfile: path.join(process.cwd(), outFolder, outFile),
    target: 'node12',
    treeShaking: true,
  });

  if (errors.length > 0) {
    throw errors;
  }
};
