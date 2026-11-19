import type {
  CloudFormationGetAtt,
  CloudFormationTemplate,
} from '@ttoss/cloudformation';

import { PASSWORD_MINIMUM_LENGTH } from './config';
import {
  type AdditionalAppClientConfig,
  applyAdditionalAppClients,
  applyDomain,
  applyResourceServers,
  type DomainConfig,
  type OAuthConfig,
  type ResourceServerConfig,
} from './template-hosted-ui';
import type { IdentityPoolConfig } from './template-identity-pool';
import {
  applyIdentityPool,
  IdentityPoolAuthenticatedIAMRoleLogicalId,
  IdentityPoolUnauthenticatedIAMRoleLogicalId,
} from './template-identity-pool';
import {
  applyIdentityProviders,
  applyPrimaryAppClient,
  type IdentityProviderConfig,
} from './template-identity-providers';

export type { CloudFormationTemplate };

export type { IdentityPoolConfig };
export type {
  AdditionalAppClientConfig,
  DomainConfig,
  OAuthConfig,
  ResourceServerConfig,
  ResourceServerScope,
} from './template-hosted-ui';
export { defaultPrincipalTags } from './template-identity-pool';
export type {
  IdentityProviderConfig,
  IdentityProviderType,
} from './template-identity-providers';
export { identityProviderLogicalId } from './template-identity-providers';
export { toPascalCase } from './toPascalCase';

const CognitoUserPoolLogicalId = 'CognitoUserPool';
const CognitoUserPoolClientLogicalId = 'CognitoUserPoolClient';
const CognitoIdentityPoolLogicalId = 'CognitoIdentityPool';

export const DenyStatement = {
  Effect: 'Deny' as const,
  Action: ['*'],
  Resource: ['*'],
};

type SchemaAttribute = {
  attributeDataType?: 'Boolean' | 'DateTime' | 'Number' | 'String';
  developerOnlyAttribute?: boolean;
  mutable?: boolean;
  name?: string;
  numberAttributeConstraints?: { maxValue?: string; minValue?: string };
  required?: boolean;
  stringAttributeConstraints?: { maxLength: string; minLength: string };
};

type LambdaTriggers = {
  preSignUp?: string | CloudFormationGetAtt;
  postConfirmation?: string | CloudFormationGetAtt;
  preAuthentication?: string | CloudFormationGetAtt;
  postAuthentication?: string | CloudFormationGetAtt;
  defineAuthChallenge?: string | CloudFormationGetAtt;
  createAuthChallenge?: string | CloudFormationGetAtt;
  verifyAuthChallengeResponse?: string | CloudFormationGetAtt;
  preTokenGeneration?: string | CloudFormationGetAtt;
  userMigration?: string | CloudFormationGetAtt;
  customMessage?: string | CloudFormationGetAtt;
  customEmailSender?: string | CloudFormationGetAtt;
  customSMSSender?: string | CloudFormationGetAtt;
};

/**
 * Password rules of the user pool. They apply to new and changed passwords
 * only; existing passwords stay valid. Omitted fields keep the defaults.
 */
export type PasswordPolicyConfig = {
  /** Minimum password length. Defaults to `PASSWORD_MINIMUM_LENGTH` (8). */
  minimumLength?: number;
  /** Defaults to `false`. */
  requireLowercase?: boolean;
  /** Defaults to `false`. */
  requireNumbers?: boolean;
  /** Defaults to `false`. */
  requireSymbols?: boolean;
  /** Defaults to `false`. */
  requireUppercase?: boolean;
  /** Defaults to 30. */
  temporaryPasswordValidityDays?: number;
};

type CreateAuthTemplateParams = {
  passwordPolicy?: PasswordPolicyConfig;
  /**
   * Sets `PreventUserExistenceErrors: ENABLED` on the primary app client:
   * sign-in, ForgotPassword and confirmation answer the same way for an
   * unknown user as for a known one, so an email cannot be probed for an
   * account. Sign-up still answers `UsernameExistsException`. Defaults to
   * `false` (the Cognito default for clients created by CloudFormation).
   */
  preventUserExistenceErrors?: boolean;
  autoVerifiedAttributes?: Array<'email' | 'phone_number'> | null | false;
  identityPool?: IdentityPoolConfig;
  schema?: SchemaAttribute[];
  usernameAttributes?: Array<'email' | 'phone_number'> | null;
  lambdaTriggers?: LambdaTriggers;
  deletionProtection?: 'ACTIVE' | 'INACTIVE';
  domain?: DomainConfig;
  oauth?: OAuthConfig;
  identityProviders?: IdentityProviderConfig[];
  resourceServers?: ResourceServerConfig[];
  additionalAppClients?: AdditionalAppClientConfig[];
};

const buildPasswordPolicy = (passwordPolicy: PasswordPolicyConfig = {}) => {
  return {
    MinimumLength: passwordPolicy.minimumLength ?? PASSWORD_MINIMUM_LENGTH,
    RequireLowercase: passwordPolicy.requireLowercase ?? false,
    RequireNumbers: passwordPolicy.requireNumbers ?? false,
    RequireSymbols: passwordPolicy.requireSymbols ?? false,
    RequireUppercase: passwordPolicy.requireUppercase ?? false,
    TemporaryPasswordValidityDays:
      passwordPolicy.temporaryPasswordValidityDays ?? 30,
  };
};

const buildBaseTemplate = ({
  autoVerifiedAttributes,
  usernameAttributes,
  deletionProtection,
  passwordPolicy,
}: Pick<
  CreateAuthTemplateParams,
  | 'autoVerifiedAttributes'
  | 'usernameAttributes'
  | 'deletionProtection'
  | 'passwordPolicy'
>): CloudFormationTemplate => {
  const AutoVerifiedAttributes =
    Array.isArray(autoVerifiedAttributes) && autoVerifiedAttributes.length > 0
      ? autoVerifiedAttributes
      : [];

  return {
    AWSTemplateFormatVersion: '2010-09-09',
    Resources: {
      [CognitoUserPoolLogicalId]: {
        Type: 'AWS::Cognito::UserPool',
        Properties: {
          AutoVerifiedAttributes,
          Policies: {
            PasswordPolicy: {
              ...buildPasswordPolicy(passwordPolicy),
            },
          },
          UsernameAttributes: usernameAttributes,
          UsernameConfiguration: { CaseSensitive: false },
          UserPoolName: { Ref: 'AWS::StackName' },
          ...(deletionProtection && { DeletionProtection: deletionProtection }),
        },
      },
      [CognitoUserPoolClientLogicalId]: {
        Type: 'AWS::Cognito::UserPoolClient',
        Properties: {
          SupportedIdentityProviders: ['COGNITO'],
          UserPoolId: { Ref: 'CognitoUserPool' },
        },
      },
    },
    Outputs: {
      Region: {
        Description: 'You use this value on Amplify Auth `region`.',
        Value: { Ref: 'AWS::Region' },
        Export: {
          Name: { 'Fn::Join': [':', [{ Ref: 'AWS::StackName' }, 'Region']] },
        },
      },
      UserPoolId: {
        Description: 'You use this value on Amplify Auth `userPoolId`.',
        Value: { Ref: CognitoUserPoolLogicalId },
        Export: {
          Name: {
            'Fn::Join': [':', [{ Ref: 'AWS::StackName' }, 'UserPoolId']],
          },
        },
      },
      AppClientId: {
        Description:
          'You use this value on Amplify Auth `userPoolWebClientId`.',
        Value: { Ref: CognitoUserPoolClientLogicalId },
        Export: {
          Name: {
            'Fn::Join': [':', [{ Ref: 'AWS::StackName' }, 'AppClientId']],
          },
        },
      },
    },
  };
};

const applySchema = (
  template: CloudFormationTemplate,
  schema: SchemaAttribute[]
) => {
  const Schema = schema.map((attribute) => {
    return {
      AttributeDataType: attribute.attributeDataType,
      DeveloperOnlyAttribute: attribute.developerOnlyAttribute,
      Mutable: attribute.mutable,
      Name: attribute.name,
      Required: attribute.required,
      NumberAttributeConstraints: attribute.numberAttributeConstraints
        ? {
            MaxValue: attribute.numberAttributeConstraints.maxValue,
            MinValue: attribute.numberAttributeConstraints.minValue,
          }
        : undefined,
      StringAttributeConstraints: attribute.stringAttributeConstraints
        ? {
            MaxLength: attribute.stringAttributeConstraints.maxLength,
            MinLength: attribute.stringAttributeConstraints.minLength,
          }
        : undefined,
    };
  });

  template.Resources[CognitoUserPoolLogicalId].Properties = {
    ...template.Resources[CognitoUserPoolLogicalId].Properties,
    Schema,
  };
};

const applyLambdaTriggers = (
  template: CloudFormationTemplate,
  lambdaTriggers: LambdaTriggers
) => {
  const triggerMap: Array<[keyof LambdaTriggers, string]> = [
    ['preSignUp', 'PreSignUp'],
    ['postConfirmation', 'PostConfirmation'],
    ['preAuthentication', 'PreAuthentication'],
    ['postAuthentication', 'PostAuthentication'],
    ['defineAuthChallenge', 'DefineAuthChallenge'],
    ['createAuthChallenge', 'CreateAuthChallenge'],
    ['verifyAuthChallengeResponse', 'VerifyAuthChallengeResponse'],
    ['preTokenGeneration', 'PreTokenGeneration'],
    ['userMigration', 'UserMigration'],
    ['customMessage', 'CustomMessage'],
    ['customEmailSender', 'CustomEmailSender'],
    ['customSMSSender', 'CustomSMSSender'],
  ];

  const LambdaConfig: Record<string, string | CloudFormationGetAtt> = {};

  for (const [key, cfKey] of triggerMap) {
    const value = lambdaTriggers[key];
    if (value) LambdaConfig[cfKey] = value;
  }

  if (Object.keys(LambdaConfig).length === 0) return;

  template.Resources[CognitoUserPoolLogicalId].Properties = {
    ...template.Resources[CognitoUserPoolLogicalId].Properties,
    LambdaConfig,
  };

  for (const [key, lambdaTrigger] of Object.entries(LambdaConfig)) {
    const permissionLogicalId =
      `${key}PermissionFor${CognitoUserPoolLogicalId}`.slice(0, 255);

    template.Resources[permissionLogicalId] = {
      Type: 'AWS::Lambda::Permission',
      Properties: {
        Action: 'lambda:InvokeFunction',
        FunctionName: lambdaTrigger,
        Principal: 'cognito-idp.amazonaws.com',
        SourceArn: { 'Fn::GetAtt': [CognitoUserPoolLogicalId, 'Arn'] },
      },
    };
  }
};

const applyAll = (
  template: CloudFormationTemplate,
  params: CreateAuthTemplateParams
) => {
  if (params.schema) applySchema(template, params.schema);
  if (params.identityPool?.enabled)
    applyIdentityPool(template, params.identityPool);
  if (params.lambdaTriggers)
    applyLambdaTriggers(template, params.lambdaTriggers);
  if (params.domain) applyDomain(template, params.domain);
  if (params.identityProviders)
    applyIdentityProviders(template, params.identityProviders);
  applyPrimaryAppClient(template, params);
  if (params.resourceServers)
    applyResourceServers(template, params.resourceServers);
  if (params.additionalAppClients)
    applyAdditionalAppClients(template, params.additionalAppClients);
};

export const createAuthTemplate = (
  params: CreateAuthTemplateParams = {}
): CloudFormationTemplate => {
  const {
    autoVerifiedAttributes = ['email'],
    usernameAttributes = ['email'],
    deletionProtection,
    passwordPolicy,
  } = params;

  if (params.identityProviders?.length && !params.domain) {
    throw new Error(
      'createAuthTemplate: `domain` is required when `identityProviders` is set — federated sign-in goes through the hosted UI.'
    );
  }

  const template = buildBaseTemplate({
    autoVerifiedAttributes,
    usernameAttributes,
    deletionProtection,
    passwordPolicy,
  });

  applyAll(template, params);

  return template;
};

createAuthTemplate.CognitoUserPoolLogicalId = CognitoUserPoolLogicalId;
createAuthTemplate.CognitoUserPoolClientLogicalId =
  CognitoUserPoolClientLogicalId;
createAuthTemplate.CognitoIdentityPoolLogicalId = CognitoIdentityPoolLogicalId;
createAuthTemplate.IdentityPoolAuthenticatedIAMRoleLogicalId =
  IdentityPoolAuthenticatedIAMRoleLogicalId;
createAuthTemplate.IdentityPoolUnauthenticatedIAMRoleLogicalId =
  IdentityPoolUnauthenticatedIAMRoleLogicalId;
