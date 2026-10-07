export { type AppSyncInfo, createAppSyncMiddleware } from './appSyncMiddleware';
export {
  AppSyncNoneDataSourceLogicalId,
  createApiTemplate,
} from './createApiTemplate';
export {
  type AppSyncResolverHandler,
  type BaseAppSyncContext,
  createAppSyncResolverHandler,
  type CreateContext,
} from './createAppSyncResolverHandler';
export {
  type CodedError,
  createAppSyncI18nMiddleware,
  type ErrorTypeArgs,
  getRequestLocale,
} from './i18n';
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
export type {
  AppSyncIdentity,
  AppSyncIdentityCognito,
  AppSyncIdentityIAM,
  AppSyncIdentityLambda,
  AppSyncIdentityOIDC,
} from 'aws-lambda';
