export { createApiTemplate } from './createApiTemplate';
export { createAppSyncMiddleware, type AppSyncInfo } from './appSyncMiddleware';
export {
  type AppSyncResolverHandler,
  type BaseAppSyncContext,
  createAppSyncResolverHandler,
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
