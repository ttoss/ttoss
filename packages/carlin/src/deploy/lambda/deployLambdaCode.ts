import { buildLambdaCode } from './buildLambdaCode';
import { deployLambdaLayers } from './deployLambdaLayers';
// import { uploadCodeToECR } from './uploadCodeToECR';
import { uploadCodeToS3 } from './uploadCodeToS3';
import fs from 'fs';
import log from 'npmlog';

const logPrefix = 'lambda';

export const deployLambdaCode = async ({
  // lambdaDockerfile,
  lambdaExternal,
  lambdaImage,
  lambdaEntryPoints,
  lambdaEntryPointsBasePath,
  lambdaOutdir,
  stackName,
}: {
  lambdaDockerfile?: string;
  lambdaExternal: string[];
  lambdaImage?: boolean;
  lambdaEntryPoints: string[];
  lambdaEntryPointsBasePath: string;
  lambdaOutdir: string;
  stackName: string;
}) => {
  log.info(logPrefix, 'Deploying Lambda code...');

  for (const entryPoint of lambdaEntryPoints) {
    if (!fs.existsSync(entryPoint)) {
      throw new Error(`Entry point ${entryPoint} does not exist.`);
    }
  }

  await buildLambdaCode({
    lambdaExternal,
    lambdaEntryPoints,
    lambdaEntryPointsBasePath,
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

  log.info(logPrefix, 'Upload code to ECR is not implemented yet.');

  process.exit(1);

  // const { imageUri } = await uploadCodeToECR({
  //   bucket,
  //   key,
  //   versionId,
  //   lambdaDockerfile,
  //   lambdaExternal,
  // });

  // return { imageUri };
};
