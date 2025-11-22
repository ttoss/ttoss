export const NAME = 'carlin';

export const AWS_DEFAULT_REGION = 'us-east-1';

/**
 * CloudFront triggers can be only in US East (N. Virginia) Region.
 * https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-requirements-limits.html#lambda-requirements-cloudfront-triggers
 */
export const CLOUDFRONT_REGION = 'us-east-1';

/**
 * Default Node.js version used by CodeBuild runtimes.
 * https://docs.aws.amazon.com/codebuild/latest/userguide/available-runtimes.html#linux-runtimes
 * On Carlin, it's used to configure the runtime for the Lambda Layer Builder.
 */
export const DEFAULT_NODE_VERSION = '24';

/**
 * Default Node.js runtime string.
 */
export const DEFAULT_NODE_RUNTIME = `nodejs${DEFAULT_NODE_VERSION}.x`;
