export const NAME = 'carlin';

export const AWS_DEFAULT_REGION = 'us-east-1';

/**
 * CloudFront triggers can be only in US East (N. Virginia) Region.
 * https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-requirements-limits.html#lambda-requirements-cloudfront-triggers
 */
export const CLOUDFRONT_REGION = 'us-east-1';

/**
 * Used by CodeBuild runtimes.
 * https://docs.aws.amazon.com/codebuild/latest/userguide/available-runtimes.html#linux-runtimes
 * On Carlin, it's used to configure the runtime for the Lambda Layer Builder.
 */
export const NODE_VERSION = '24';

export const NODE_RUNTIME = `nodejs${NODE_VERSION}.x`;
