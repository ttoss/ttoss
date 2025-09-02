/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type {
  CloudFormationGetAtt,
  CloudFormationTemplate,
  Policy,
} from '@ttoss/cloudformation';

import { PASSWORD_MINIMUM_LENGTH } from './config';

const CognitoUserPoolLogicalId = 'CognitoUserPool';

const CognitoUserPoolClientLogicalId = 'CognitoUserPoolClient';

const CognitoIdentityPoolLogicalId = 'CognitoIdentityPool';

const IdentityPoolAuthenticatedIAMRoleLogicalId =
  'IdentityPoolAuthenticatedIAMRole';

const IdentityPoolUnauthenticatedIAMRoleLogicalId =
  'IdentityPoolUnauthenticatedIAMRole';

export const DenyStatement = {
  Effect: 'Deny' as const,
  Action: ['*'],
  Resource: ['*'],
};

export const defaultPrincipalTags = {
  appClientId: 'aud',
  userId: 'sub',
};

type SchemaAttribute = {
  attributeDataType?: 'Boolean' | 'DateTime' | 'Number' | 'String';
  developerOnlyAttribute?: boolean;
  mutable?: boolean;
  name?: string;
  numberAttributeConstraints?: {
    maxValue?: string;
    minValue?: string;
  };
  required?: boolean;
  stringAttributeConstraints?: {
    maxLength: string;
    minLength: string;
  };
};

type IdentityPoolConfig = {
  enabled?: boolean;
  name?: string;
  allowUnauthenticatedIdentities?: boolean;
  authenticatedRoleArn?: string;
  authenticatedPolicies?: Policy[];
  unauthenticatedRoleArn?: string;
  unauthenticatedPolicies?: Policy[];
  principalTags?: Record<string, string> | boolean;
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

type CreateAuthTemplateParams = {
  autoVerifiedAttributes?: Array<'email' | 'phone_number'> | null | false;
  identityPool?: IdentityPoolConfig;
  schema?: SchemaAttribute[];
  usernameAttributes?: Array<'email' | 'phone_number'> | null;
  lambdaTriggers?: LambdaTriggers;
  deletionProtection?: 'ACTIVE' | 'INACTIVE';
};

export const createAuthTemplate = ({
  autoVerifiedAttributes = ['email'],
  identityPool,
  schema,
  usernameAttributes = ['email'],
  lambdaTriggers,
  deletionProtection,
}: CreateAuthTemplateParams = {}): CloudFormationTemplate => {
  const AutoVerifiedAttributes =
    Array.isArray(autoVerifiedAttributes) && autoVerifiedAttributes.length > 0
      ? autoVerifiedAttributes
      : [];

  const template: CloudFormationTemplate = {
    AWSTemplateFormatVersion: '2010-09-09',
    Resources: {
      [CognitoUserPoolLogicalId]: {
        /**
         * https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-cognito-userpool.html
         */
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
          UsernameConfiguration: {
            CaseSensitive: false,
          },
          UserPoolName: {
            Ref: 'AWS::StackName',
          },
          ...(deletionProtection && { DeletionProtection: deletionProtection }),
        },
      },
      [CognitoUserPoolClientLogicalId]: {
        /**
         * https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-cognito-userpoolclient.html
         */
        Type: 'AWS::Cognito::UserPoolClient',
        Properties: {
          SupportedIdentityProviders: ['COGNITO'],
          UserPoolId: {
            Ref: 'CognitoUserPool',
          },
        },
      },
    },
    Outputs: {
      Region: {
        Description: 'You use this value on Amplify Auth `region`.',
        Value: {
          Ref: 'AWS::Region',
        },
        Export: {
          Name: {
            'Fn::Join': [':', [{ Ref: 'AWS::StackName' }, 'Region']],
          },
        },
      },
      UserPoolId: {
        Description: 'You use this value on Amplify Auth `userPoolId`.',
        Value: {
          Ref: CognitoUserPoolLogicalId,
        },
        Export: {
          Name: {
            'Fn::Join': [':', [{ Ref: 'AWS::StackName' }, 'UserPoolId']],
          },
        },
      },
      AppClientId: {
        Description:
          'You use this value on Amplify Auth `userPoolWebClientId`.',
        Value: {
          Ref: CognitoUserPoolClientLogicalId,
        },
        Export: {
          Name: {
            'Fn::Join': [':', [{ Ref: 'AWS::StackName' }, 'AppClientId']],
          },
        },
      },
    },
  };

  if (schema) {
    const Schema = schema.map((attribute) => {
      let NumberAttributeConstraints = undefined;

      if (attribute.numberAttributeConstraints) {
        NumberAttributeConstraints = {
          MaxValue: attribute.numberAttributeConstraints?.maxValue,
          MinValue: attribute.numberAttributeConstraints?.minValue,
        };
      }

      let StringAttributeConstraints = undefined;

      if (attribute.stringAttributeConstraints) {
        StringAttributeConstraints = {
          MaxLength: attribute.stringAttributeConstraints?.maxLength,
          MinLength: attribute.stringAttributeConstraints?.minLength,
        };
      }

      return {
        AttributeDataType: attribute.attributeDataType,
        DeveloperOnlyAttribute: attribute.developerOnlyAttribute,
        Mutable: attribute.mutable,
        Name: attribute.name,
        NumberAttributeConstraints,
        Required: attribute.required,
        StringAttributeConstraints,
      };
    });

    template.Resources[CognitoUserPoolLogicalId].Properties!.Schema = Schema;
  }

  if (identityPool?.enabled) {
    template.Resources[CognitoIdentityPoolLogicalId] = {
      /**
       * https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-cognito-identitypool.html
       */
      Type: 'AWS::Cognito::IdentityPool',
      Properties: {
        AllowUnauthenticatedIdentities:
          identityPool.allowUnauthenticatedIdentities || false,
        CognitoIdentityProviders: [
          {
            ClientId: {
              Ref: CognitoUserPoolClientLogicalId,
            },
            ProviderName: {
              'Fn::GetAtt': [CognitoUserPoolLogicalId, 'ProviderName'],
            },
          },
        ],
      },
    };

    if (identityPool.name) {
      template.Resources[
        CognitoIdentityPoolLogicalId
      ].Properties!.IdentityPoolName = identityPool.name;
    }

    template.Resources.CognitoIdentityPoolRoleAttachment = {
      /**
       * https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-cognito-identitypoolroleattachment.html
       */
      Type: 'AWS::Cognito::IdentityPoolRoleAttachment',
      Properties: {
        IdentityPoolId: {
          Ref: CognitoIdentityPoolLogicalId,
        },
        Roles: {},
      },
    };

    if (!identityPool.authenticatedRoleArn) {
      template.Resources[IdentityPoolAuthenticatedIAMRoleLogicalId] = {
        Type: 'AWS::IAM::Role',
        Properties: {
          AssumeRolePolicyDocument: {
            Version: '2012-10-17' as const,
            Statement: [
              {
                Effect: 'Allow' as const,
                Principal: {
                  Federated: 'cognito-identity.amazonaws.com',
                },
                Action: ['sts:AssumeRoleWithWebIdentity', 'sts:TagSession'],
                Condition: {
                  StringEquals: {
                    'cognito-identity.amazonaws.com:aud': {
                      Ref: CognitoIdentityPoolLogicalId,
                    },
                  },
                  'ForAnyValue:StringLike': {
                    'cognito-identity.amazonaws.com:amr': 'authenticated',
                  },
                },
              },
            ],
          },
          Policies: identityPool.authenticatedPolicies || [
            {
              PolicyName: 'IdentityPoolAuthenticatedIAMRolePolicyName',
              PolicyDocument: {
                Version: '2012-10-17' as const,
                Statement: [DenyStatement],
              },
            },
          ],
        },
      };

      template.Resources.CognitoIdentityPoolRoleAttachment.Properties!.Roles.authenticated =
        {
          'Fn::GetAtt': [IdentityPoolAuthenticatedIAMRoleLogicalId, 'Arn'],
        };
    } else {
      template.Resources.CognitoIdentityPoolRoleAttachment.Properties!.Roles.authenticated =
        identityPool.authenticatedRoleArn;
    }

    if (!identityPool.unauthenticatedRoleArn) {
      template.Resources[IdentityPoolUnauthenticatedIAMRoleLogicalId] = {
        Type: 'AWS::IAM::Role',
        Properties: {
          AssumeRolePolicyDocument: {
            Version: '2012-10-17' as const,
            Statement: [
              {
                Effect: 'Allow' as const,
                Principal: {
                  Federated: 'cognito-identity.amazonaws.com',
                },
                Action: 'sts:AssumeRoleWithWebIdentity',
                Condition: {
                  StringEquals: {
                    'cognito-identity.amazonaws.com:aud': {
                      Ref: CognitoIdentityPoolLogicalId,
                    },
                  },
                  'ForAnyValue:StringLike': {
                    'cognito-identity.amazonaws.com:amr': 'unauthenticated',
                  },
                },
              },
            ],
          },
          Policies: identityPool.unauthenticatedPolicies || [
            {
              PolicyName: 'IdentityPoolUnauthenticatedIAMRolePolicyName',
              PolicyDocument: {
                Version: '2012-10-17' as const,
                Statement: [DenyStatement],
              },
            },
          ],
        },
      };

      template.Resources.CognitoIdentityPoolRoleAttachment.Properties!.Roles.unauthenticated =
        {
          'Fn::GetAtt': [IdentityPoolUnauthenticatedIAMRoleLogicalId, 'Arn'],
        };
    } else {
      template.Resources.CognitoIdentityPoolRoleAttachment.Properties!.Roles.unauthenticated =
        identityPool.unauthenticatedRoleArn;
    }

    /**
     * https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-cognito-identitypoolprincipaltag.html
     */
    if (
      identityPool.principalTags ||
      identityPool.principalTags === undefined
    ) {
      const PrincipalTags = (() => {
        if (typeof identityPool.principalTags === 'boolean') {
          return defaultPrincipalTags;
        }

        if (identityPool.principalTags === undefined) {
          return defaultPrincipalTags;
        }

        return identityPool.principalTags;
      })();

      template.Resources.CognitoIdentityPoolPrincipalTag = {
        Type: 'AWS::Cognito::IdentityPoolPrincipalTag',
        Properties: {
          IdentityPoolId: {
            Ref: CognitoIdentityPoolLogicalId,
          },
          IdentityProviderName: {
            'Fn::GetAtt': [CognitoUserPoolLogicalId, 'ProviderName'],
          },
          PrincipalTags,
          UseDefaults: false,
        },
      };
    }

    template.Outputs!.IdentityPoolId = {
      Description: 'You use this value on Amplify Auth `identityPoolId`.',
      Value: {
        Ref: CognitoIdentityPoolLogicalId,
      },
      Export: {
        Name: {
          'Fn::Join': [
            ':',
            [{ Ref: 'AWS::StackName' }, 'CognitoIdentityPoolId'],
          ],
        },
      },
    };
  }

  // Apply Lambda triggers if provided
  if (lambdaTriggers) {
    const LambdaConfig: Record<string, string | CloudFormationGetAtt> = {};

    if (lambdaTriggers.preSignUp) {
      LambdaConfig.PreSignUp = lambdaTriggers.preSignUp;
    }
    if (lambdaTriggers.postConfirmation) {
      LambdaConfig.PostConfirmation = lambdaTriggers.postConfirmation;
    }
    if (lambdaTriggers.preAuthentication) {
      LambdaConfig.PreAuthentication = lambdaTriggers.preAuthentication;
    }
    if (lambdaTriggers.postAuthentication) {
      LambdaConfig.PostAuthentication = lambdaTriggers.postAuthentication;
    }
    if (lambdaTriggers.defineAuthChallenge) {
      LambdaConfig.DefineAuthChallenge = lambdaTriggers.defineAuthChallenge;
    }
    if (lambdaTriggers.createAuthChallenge) {
      LambdaConfig.CreateAuthChallenge = lambdaTriggers.createAuthChallenge;
    }
    if (lambdaTriggers.verifyAuthChallengeResponse) {
      LambdaConfig.VerifyAuthChallengeResponse =
        lambdaTriggers.verifyAuthChallengeResponse;
    }
    if (lambdaTriggers.preTokenGeneration) {
      LambdaConfig.PreTokenGeneration = lambdaTriggers.preTokenGeneration;
    }
    if (lambdaTriggers.userMigration) {
      LambdaConfig.UserMigration = lambdaTriggers.userMigration;
    }
    if (lambdaTriggers.customMessage) {
      LambdaConfig.CustomMessage = lambdaTriggers.customMessage;
    }
    if (lambdaTriggers.customEmailSender) {
      LambdaConfig.CustomEmailSender = lambdaTriggers.customEmailSender;
    }
    if (lambdaTriggers.customSMSSender) {
      LambdaConfig.CustomSMSSender = lambdaTriggers.customSMSSender;
    }

    if (Object.keys(LambdaConfig).length > 0) {
      template.Resources[CognitoUserPoolLogicalId].Properties!.LambdaConfig =
        LambdaConfig;
    }
  }

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
