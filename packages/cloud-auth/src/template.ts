import type {
  CloudFormationGetAtt,
  CloudFormationTemplate,
} from '@ttoss/cloudformation';

import { PASSWORD_MINIMUM_LENGTH } from './config';
import type { IdentityPoolConfig } from './template-identity-pool';
import {
  applyIdentityPool,
  IdentityPoolAuthenticatedIAMRoleLogicalId,
  IdentityPoolUnauthenticatedIAMRoleLogicalId,
} from './template-identity-pool';

export type { CloudFormationTemplate };

export type { IdentityPoolConfig };
export { defaultPrincipalTags } from './template-identity-pool';

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

export type DomainConfig = {
  domainName: string;
  certificateArn?: string;
};

export type ResourceServerScope = {
  scopeName: string;
  scopeDescription: string;
};

export type ResourceServerConfig = {
  identifier: string;
  name: string;
  scopes: ResourceServerScope[];
};

export type OAuthConfig = {
  flows: Array<'code' | 'implicit' | 'client_credentials'>;
  scopes: string[];
  callbackUrls: string[];
};

export type AdditionalAppClientConfig = {
  name: string;
  generateSecret?: boolean;
  oauth?: OAuthConfig;
};

type CreateAuthTemplateParams = {
  autoVerifiedAttributes?: Array<'email' | 'phone_number'> | null | false;
  identityPool?: IdentityPoolConfig;
  schema?: SchemaAttribute[];
  usernameAttributes?: Array<'email' | 'phone_number'> | null;
  lambdaTriggers?: LambdaTriggers;
  deletionProtection?: 'ACTIVE' | 'INACTIVE';
  domain?: DomainConfig;
  resourceServers?: ResourceServerConfig[];
  additionalAppClients?: AdditionalAppClientConfig[];
};

export const toPascalCase = (name: string) => {
  return name
    .split(/[-_\s]+/)
    .map((part) => {
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join('');
};

const buildBaseTemplate = ({
  autoVerifiedAttributes,
  usernameAttributes,
  deletionProtection,
}: Pick<
  CreateAuthTemplateParams,
  'autoVerifiedAttributes' | 'usernameAttributes' | 'deletionProtection'
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
              MinimumLength: PASSWORD_MINIMUM_LENGTH,
              RequireLowercase: false,
              RequireNumbers: false,
              RequireSymbols: false,
              RequireUppercase: false,
              TemporaryPasswordValidityDays: 30,
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

const applyDomain = (
  template: CloudFormationTemplate,
  domain: DomainConfig
) => {
  template.Resources.CognitoUserPoolDomain = {
    Type: 'AWS::Cognito::UserPoolDomain',
    Properties: {
      Domain: domain.domainName,
      UserPoolId: { Ref: CognitoUserPoolLogicalId },
      ...(domain.certificateArn && {
        CustomDomainConfig: { CertificateArn: domain.certificateArn },
      }),
    },
  };

  const domainUrl = domain.certificateArn
    ? `https://${domain.domainName}`
    : {
        'Fn::Sub': `https://${domain.domainName}.auth.\${AWS::Region}.amazoncognito.com`,
      };

  template.Outputs = {
    ...template.Outputs,
    CognitoUserPoolDomainUrl: {
      Description: 'The Cognito hosted UI domain URL.',
      Value: domainUrl,
      Export: {
        Name: {
          'Fn::Join': [
            ':',
            [{ Ref: 'AWS::StackName' }, 'CognitoUserPoolDomainUrl'],
          ],
        },
      },
    },
  };
};

const applyResourceServers = (
  template: CloudFormationTemplate,
  resourceServers: ResourceServerConfig[]
) => {
  for (const server of resourceServers) {
    const logicalId = `CognitoUserPoolResourceServer${toPascalCase(server.identifier)}`;

    template.Resources[logicalId] = {
      Type: 'AWS::Cognito::UserPoolResourceServer',
      Properties: {
        Identifier: server.identifier,
        Name: server.name,
        Scopes: server.scopes.map((scope) => {
          return {
            ScopeName: scope.scopeName,
            ScopeDescription: scope.scopeDescription,
          };
        }),
        UserPoolId: { Ref: CognitoUserPoolLogicalId },
      },
    };
  }
};

const applyAdditionalAppClients = (
  template: CloudFormationTemplate,
  additionalAppClients: AdditionalAppClientConfig[]
) => {
  for (const client of additionalAppClients) {
    const pascalName = toPascalCase(client.name);
    const logicalId = `AppClient${pascalName}`;
    const outputKey = `AppClientId${pascalName}`;

    template.Resources[logicalId] = {
      Type: 'AWS::Cognito::UserPoolClient',
      Properties: {
        ClientName: client.name,
        UserPoolId: { Ref: CognitoUserPoolLogicalId },
        SupportedIdentityProviders: ['COGNITO'],
        GenerateSecret: client.generateSecret ?? false,
        ...(client.oauth && {
          AllowedOAuthFlows: client.oauth.flows,
          AllowedOAuthFlowsUserPoolClient: true,
          AllowedOAuthScopes: client.oauth.scopes,
          CallbackURLs: client.oauth.callbackUrls,
        }),
      },
    };

    template.Outputs = {
      ...template.Outputs,
      [outputKey]: {
        Description: `App client ID for ${client.name}.`,
        Value: { Ref: logicalId },
        Export: {
          Name: {
            'Fn::Join': [':', [{ Ref: 'AWS::StackName' }, outputKey]],
          },
        },
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
  } = params;

  const template = buildBaseTemplate({
    autoVerifiedAttributes,
    usernameAttributes,
    deletionProtection,
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
