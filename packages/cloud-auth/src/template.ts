import { PASSWORD_MINIMUM_LENGTH } from './config';
import type { CloudFormationTemplate, Policy } from '@ttoss/cloudformation';

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

export const createAuthTemplate = ({
  autoVerifiedAttributes = ['email'],
  identityPool,
  schema,
  usernameAttributes = ['email'],
}: {
  autoVerifiedAttributes?: Array<'email' | 'phone_number'> | null | false;
  identityPool?: {
    enabled?: boolean;
    name?: string;
    allowUnauthenticatedIdentities?: boolean;
    authenticatedRoleArn?: string;
    authenticatedPolicies?: Policy[];
    unauthenticatedRoleArn?: string;
    unauthenticatedPolicies?: Policy[];
  };
  /**
   * https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cognito-userpool-schemaattribute.html
   */
  schema?: {
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
  }[];
  usernameAttributes?: Array<'email' | 'phone_number'> | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} = {}): any => {
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

    template.Resources[CognitoUserPoolLogicalId].Properties.Schema = Schema;
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
      ].Properties.IdentityPoolName = identityPool.name;
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

      template.Resources.CognitoIdentityPoolRoleAttachment.Properties.Roles.authenticated =
        {
          'Fn::GetAtt': [IdentityPoolAuthenticatedIAMRoleLogicalId, 'Arn'],
        };
    } else {
      template.Resources.CognitoIdentityPoolRoleAttachment.Properties.Roles.authenticated =
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
          Policies: identityPool.authenticatedPolicies || [
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

      template.Resources.CognitoIdentityPoolRoleAttachment.Properties.Roles.unauthenticated =
        {
          'Fn::GetAtt': [IdentityPoolUnauthenticatedIAMRoleLogicalId, 'Arn'],
        };
    } else {
      template.Resources.CognitoIdentityPoolRoleAttachment.Properties.Roles.unauthenticated =
        identityPool.unauthenticatedRoleArn;
    }

    if (!template.Outputs) {
      template.Outputs = {};
    }

    template.Outputs.IdentityPoolId = {
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
