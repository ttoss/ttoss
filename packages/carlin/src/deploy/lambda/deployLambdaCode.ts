import { buildLambdaSingleFile } from './buildLambdaSingleFile';
import { deployLambdaLayers } from './deployLambdaLayers';
import { uploadCodeToECR } from './uploadCodeToECR';
import { uploadCodeToS3 } from './uploadCodeToS3';
import fs from 'fs';
import log from 'npmlog';

const logPrefix = 'lambda';

/**
 * 1. Build Lambda code using esbuild. The build process will create a single
 * file with all your code.
 *  1. The build will ignore packages on `lambda-externals` option.
 * 1. Zip the output file.
 * 1. Upload the zipped code to base stack bucket.
 * 1. Add the code bucket, key and version to the CloudFormation template as
 * parameters.
 */
export const deployLambdaCode = async ({
  lambdaDockerfile,
  lambdaExternals,
  lambdaImage,
  lambdaInput,
  stackName,
}: {
  lambdaDockerfile?: string;
  lambdaExternals: string[];
  lambdaImage?: boolean;
  lambdaInput: string;
  stackName: string;
}) => {
  if (!fs.existsSync(lambdaInput)) {
    return undefined;
  }

  log.info(logPrefix, 'Deploying Lambda code...');

  await buildLambdaSingleFile({ lambdaExternals, lambdaInput });

  const { bucket, key, versionId } = await uploadCodeToS3({ stackName });

  if (!lambdaImage) {
    await deployLambdaLayers({ lambdaExternals });
    return { bucket, key, versionId };
  }

  const { imageUri } = await uploadCodeToECR({
    bucket,
    key,
    versionId,
    lambdaDockerfile,
    lambdaExternals,
  });

  return { imageUri };
};
