import { deploy } from '../cloudformation.core';
import { handleDeployError, handleDeployInitialization } from '../utils';
import { getStaticAppBucket } from './getStaticAppBucket';
import { invalidateCloudFront } from './invalidateCloudFront';
import { removeOldVersions } from './removeOldVersions';
import { getStaticAppTemplate } from './staticApp.template';
import { uploadBuiltAppToS3 } from './uploadBuiltAppToS3';

const logPrefix = 'static-app';

/**
 * 1. Create the stack name that will be passed to CloudFormation.
 * 1. Create a CloudFormation template based on the type of the deployment, and
 *    the options, for instance, only S3, SPA, with hosted zone...
 * 1. Create AWS resources using the templated created.
 * 1. Upload static files to the host bucket S3.
 * 1. Remove old deployment versions. Keep only the 3 most recent ones.
 */
export const deployStaticApp = async ({
  acm,
  aliases,
  appendIndexHtml,
  buildFolder,
  cloudfront,
  spa,
  hostedZoneName,
  region,
  skipUpload,
}: {
  acm?: string;
  aliases?: string[];
  appendIndexHtml?: boolean;
  buildFolder?: string;
  cloudfront?: boolean;
  spa?: boolean;
  hostedZoneName?: string;
  region: string;
  skipUpload?: boolean;
}) => {
  try {
    const { stackName } = await handleDeployInitialization({ logPrefix });

    const params = { StackName: stackName };

    const template = getStaticAppTemplate({
      acm,
      aliases,
      appendIndexHtml,
      cloudfront,
      spa,
      hostedZoneName,
      region,
    });

    const bucket = await getStaticAppBucket({ stackName });

    /**
     * Stack already exists. Upload files first after changing the files routes
     * because of the version changing.
     */
    if (bucket) {
      if (!skipUpload) {
        await uploadBuiltAppToS3({ buildFolder, bucket, cloudfront });
      }

      const { Outputs } = await deploy({ params, template });

      await invalidateCloudFront({ outputs: Outputs });

      if (!skipUpload) {
        await removeOldVersions({ bucket });
      }
    } else {
      /**
       * Stack doesn't exist. Deploy CloudFormation first, get the bucket name,
       * and upload files to S3.
       */

      await deploy({ params, template });

      const newBucket = await getStaticAppBucket({ stackName });

      if (!newBucket) {
        throw new Error(`Cannot find bucket at ${stackName}.`);
      }

      await uploadBuiltAppToS3({ buildFolder, bucket: newBucket, cloudfront });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    handleDeployError({ error, logPrefix });
  }
};
