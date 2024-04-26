import AWS from 'aws-sdk';
import log from 'npmlog';

const CLOUDFRONT_DISTRIBUTION_ID = 'CloudFrontDistributionId';

const logPrefix = 'static-app';

export const invalidateCloudFront = async ({
  outputs,
}: {
  outputs?: AWS.CloudFormation.Outputs;
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

    const params: AWS.CloudFront.CreateInvalidationRequest = {
      DistributionId: distributionId,
      InvalidationBatch: {
        CallerReference: new Date().toISOString(),
        Paths: {
          Items: ['/*'],
          Quantity: 1,
        },
      },
    };

    const cloudFront = new AWS.CloudFront();

    try {
      await cloudFront.createInvalidation(params).promise();
      log.info(
        logPrefix,
        `CloudFront Distribution ID ${distributionId} invalidated with success.`
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      log.error(
        logPrefix,
        `Error while trying to invalidate CloudFront distribution ${distributionId}.`
      );
      log.error(logPrefix, err);
    }
  } else {
    log.info(
      logPrefix,
      `Cannot invalidate because distribution does not exist.`
    );
  }
};
