import { buildLambdaCode } from './buildLambdaCode';
import { deployLambdaLayers } from './deployLambdaLayers';
import { uploadCodeToECR } from './uploadCodeToECR';
import { uploadCodeToS3 } from './uploadCodeToS3';
import fs from 'node:fs';
import log from 'npmlog';
import path from 'node:path';

const logPrefix = 'lambda';

export const deployLambdaCode = async ({
  lambdaDockerfile,
  lambdaExternal = [],
  lambdaImage,
  lambdaEntryPoints,
  lambdaEntryPointsBaseDir = 'src',
  lambdaFormat,
  lambdaOutdir = 'dist',
  stackName,
}: {
  lambdaDockerfile?: string;
  lambdaExternal?: string[];
  lambdaImage?: boolean;
  lambdaEntryPoints: string[];
  lambdaEntryPointsBaseDir?: string;
  lambdaFormat?: 'esm' | 'cjs';
  lambdaOutdir?: string;
  stackName: string;
}) => {
  if (!lambdaEntryPoints.length) {
    return {};
  }

  log.info(logPrefix, 'Deploying Lambda code...');

  for (const entryPoint of lambdaEntryPoints) {
    const entryPointPath = path.resolve(lambdaEntryPointsBaseDir, entryPoint);
    if (!fs.existsSync(entryPointPath)) {
      throw new Error(`Entry point ${entryPointPath} does not exist.`);
    }
  }

  await buildLambdaCode({
    lambdaExternal,
    lambdaEntryPoints,
    lambdaEntryPointsBaseDir,
    lambdaFormat,
    lambdaOutdir,
  });

  const { bucket, key, versionId } = await uploadCodeToS3({
    stackName,
    lambdaOutdir,
  });

  if (!lambdaImage) {
    await deployLambdaLayers({ lambdaExternal });
    return { bucket, key, versionId };
  }

  const { imageUri } = await uploadCodeToECR({
    bucket,
    key,
    versionId,
    lambdaDockerfile,
    lambdaExternal,
  });

  return { imageUri };
};
