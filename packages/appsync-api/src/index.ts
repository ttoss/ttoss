export { type AppSyncInfo, createAppSyncMiddleware } from './appSyncMiddleware';
export { createApiTemplate } from './createApiTemplate';
export {
  type AppSyncResolverHandler,
  type BaseAppSyncContext,
  createAppSyncResolverHandler,
  type CreateContext,
} from './createAppSyncResolverHandler';
export {
  AWSDateTC,
  AWSDateTimeTC,
  AWSEmailTC,
  AWSIPAddressTC,
  AWSJSONTC,
  AWSPhoneTC,
  AWSTimestampTC,
  AWSTimeTC,
  AWSURLTC,
} from './scalars';
export type { AppSyncIdentityCognito } from 'aws-lambda';
