import * as esbuild from 'esbuild';
import { typescriptConfig } from '@ttoss/config';
import builtins from 'builtin-modules';
import fs from 'node:fs';
import log from 'npmlog';
import path from 'node:path';

const logPrefix = 'lambda';

/**
 * Carlin builds the Lambda code using esbuild. It can build the code as ESM or
 * CJS format. When building as ESM, it will split the code into multiple files,
 * which reduces the payload size when deploying the Lambda function. The file
 * extension of the output files will be `.mjs` for ESM and `.cjs` for CJS.
 */
export const buildLambdaCode = async ({
  lambdaEntryPoints,
  lambdaEntryPointsBaseDir = '.',
  lambdaExternal = [],
  lambdaFormat = 'esm',
  lambdaOutdir,
}: {
  lambdaEntryPoints: string[];
  lambdaEntryPointsBaseDir: string;
  lambdaExternal?: string[];
  lambdaFormat?: 'esm' | 'cjs';
  lambdaOutdir: string;
}) => {
  log.info(logPrefix, 'Building Lambda single file...');

  /**
   * Remove the output directory if it exists to not mix old files with the
   * new ones.
   */
  if (fs.existsSync(lambdaOutdir)) {
    fs.rmSync(lambdaOutdir, { recursive: true });
  }

  const entryPoints = lambdaEntryPoints.map((entryPoint) => {
    return path.resolve(process.cwd(), lambdaEntryPointsBaseDir, entryPoint);
  });

  const { errors } = esbuild.buildSync({
    banner: {
      js: '// Powered by carlin (https://ttoss.dev/docs/carlin/)',
    },
    bundle: true,
    entryPoints,
    external: [
      /**
       * Only AWS SDK v3 on Node.js 18.x or higher.
       * https://aws.amazon.com/blogs/compute/node-js-18-x-runtime-now-available-in-aws-lambda/
       */
      '@aws-sdk/*',
      ...builtins,
      ...lambdaExternal,
    ],
    /**
     * Some packages as `graphql` are not compatible with ESM yet.
     * https://github.com/graphql/graphql-js/issues/3603
     */
    format: lambdaFormat,
    /**
     * https://esbuild.github.io/api/#minify
     */
    minifySyntax: true,
    platform: 'node',
    splitting: lambdaFormat === 'esm',
    outbase: path.join(process.cwd(), lambdaEntryPointsBaseDir),
    outdir: path.join(process.cwd(), lambdaOutdir),
    outExtension: { '.js': lambdaFormat === 'esm' ? '.mjs' : '.cjs' },
    target: typescriptConfig.target,
    treeShaking: true,
  });

  if (errors.length > 0) {
    throw errors;
  }
};
