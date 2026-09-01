export * from './config';
export {
  type AdditionalAppClientConfig,
  type CloudFormationTemplate,
  createAuthTemplate,
  defaultPrincipalTags,
  DenyStatement,
  type DomainConfig,
  type IdentityProviderConfig,
  identityProviderLogicalId,
  type IdentityProviderType,
  type OAuthConfig,
  type ResourceServerConfig,
  type ResourceServerScope,
} from './template';
export type { IdentityPoolConfig } from './template-identity-pool';
