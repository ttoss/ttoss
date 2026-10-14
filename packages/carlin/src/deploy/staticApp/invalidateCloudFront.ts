import type { Output } from '@aws-sdk/client-cloudformation';
import {
  CloudFrontClient,
  CreateInvalidationCommand,
  type CreateInvalidationCommandInput,
} from '@aws-sdk/client-cloudfront';

import { CLOUDFRONT_REGION } from '../../config';
import { log } from '../../utils/log';

const CLOUDFRONT_DISTRIBUTION_ID = 'CloudFrontDistributionId';

const logPrefix = 'static-app';

export const invalidateCloudFront = async ({
  outputs,
}: {
  outputs?: Output[];
}) => {
  log.info(logPrefix, 'Invalidating CloudFront...');

  if (!outputs) {
    log.info(logPrefix, 'Invalidation: outputs do not exist.');
    return;
  }

  const cloudFrontDistributionIDOutput = outputs.find((output) => {
    return output.OutputKey === CLOUDFRONT_DISTRIBUTION_ID;
  });

  if (cloudFrontDistributionIDOutput?.OutputValue) {
    const distributionId = cloudFrontDistributionIDOutput.OutputValue;

    const params: CreateInvalidationCommandInput = {
      DistributionId: distributionId,
      InvalidationBatch: {
        CallerReference: new Date().toISOString(),
        Paths: {
          Items: ['/*'],
          Quantity: 1,
        },
      },
    };

    /**
     * CloudFront is a global service whose API is signed in us-east-1.
     */
    const cloudFront = new CloudFrontClient({ region: CLOUDFRONT_REGION });

    try {
      await cloudFront.send(new CreateInvalidationCommand(params));
      log.info(
        logPrefix,
        `CloudFront Distribution ID ${distributionId} invalidated with success.`
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      log.error(
        logPrefix,
        `Error while trying to invalidate CloudFront distribution ${distributionId}.`
      );
      log.error(logPrefix, error);
    }
  } else {
    log.info(
      logPrefix,
      `Cannot invalidate because distribution does not exist.`
    );
  }
};
