import { deploy } from '../cloudformation.core';
import { handleDeployError, handleDeployInitialization } from '../utils';
import { getStaticAppBucket } from './getStaticAppBucket';
import { invalidateCloudFront } from './invalidateCloudFront';
import { type ResponseHeader } from './responseHeaders';
import { getStaticAppTemplate } from './staticApp.template';
import { uploadBuiltAppToS3 } from './uploadBuiltAppToS3';
import { readViewerRequestFunctionCode } from './viewerRequestFunction';

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
  redirectToTrailingSlash,
  responseHeaders,
  responseHeadersPolicy,
  spa,
  hostedZoneName,
  region,
  skipUpload,
  uploadSourceMaps,
  viewerRequestFunctionCode,
}: {
  acm?: string;
  aliases?: string[];
  appendIndexHtml?: boolean;
  buildFolder?: string;
  cloudfront?: boolean;
  redirectToTrailingSlash?: boolean;
  responseHeaders?: ResponseHeader[];
  responseHeadersPolicy?: string;
  spa?: boolean;
  hostedZoneName?: string;
  region: string;
  skipUpload?: boolean;
  uploadSourceMaps?: boolean;
  /**
   * Path to the file holding the viewer request function code, read here so the
   * template receives the source.
   */
  viewerRequestFunctionCode?: string;
}) => {
  try {
    const { stackName } = await handleDeployInitialization({ logPrefix });

    const params = { StackName: stackName };

    const template = getStaticAppTemplate({
      acm,
      aliases,
      appendIndexHtml,
      cloudfront,
      redirectToTrailingSlash,
      responseHeaders,
      responseHeadersPolicy,
      spa,
      hostedZoneName,
      region,
      viewerRequestFunctionCode: viewerRequestFunctionCode
        ? readViewerRequestFunctionCode({ filePath: viewerRequestFunctionCode })
        : undefined,
    });

    const bucket = await getStaticAppBucket({ stackName });

    /**
     * Stack already exists. Upload files first after changing the files routes
     * because of the version changing.
     */
    if (bucket) {
      if (!skipUpload) {
        await uploadBuiltAppToS3({
          buildFolder,
          bucket,
          cloudfront,
          uploadSourceMaps,
        });
      }

      const { Outputs } = await deploy({ params, template });

      await invalidateCloudFront({ outputs: Outputs });
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

      await uploadBuiltAppToS3({
        buildFolder,
        bucket: newBucket,
        cloudfront,
        uploadSourceMaps,
      });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    handleDeployError({ error, logPrefix });
  }
};
