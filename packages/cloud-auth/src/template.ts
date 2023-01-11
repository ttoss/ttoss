import { CloudFormationTemplate } from '@ttoss/cloudformation';
import { PASSWORD_MINIMUM_LENGTH } from './config';

const CognitoUserPoolLogicalId = 'CognitoUserPool';

const CognitoUserPoolClientLogicalId = 'CognitoUserPoolClient';

const CognitoIdentityPoolLogicalId = 'CognitoIdentityPool';

type Role =
  | string
  | {
      'Fn::ImportValue': string;
    };

export const createAuthTemplate = ({
  autoVerifiedAttributes = ['email'],
  identityPool = true,
  roles,
  schema,
}: {
  autoVerifiedAttributes?: Array<'email' | 'phone_number'> | null | false;
  identityPool?: boolean;
  roles?: {
    authenticated?: Role;
    unauthenticated?: Role;
  };
  /**
   * https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cognito-userpool-schemaattribute.html
   */
  schema?: {
    AttributeDataType?: 'Boolean' | 'DateTime' | 'Number' | 'String';
    DeveloperOnlyAttribute?: boolean;
    Mutable?: boolean;
    Name?: string;
    NumberAttributeConstraints?: {
      MaxValue?: string;
      MinValue?: string;
    };
    Required?: boolean;
    StringAttributeConstraints?: {
      MaxLength: string;
      MinLength: string;
    };
  }[];
} = {}) => {
  const AutoVerifiedAttributes =
    Array.isArray(autoVerifiedAttributes) && autoVerifiedAttributes.length > 0
      ? autoVerifiedAttributes
      : undefined;

  const template: CloudFormationTemplate = {
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
          Schema: schema,
          UsernameAttributes: ['email'],
          UsernameConfiguration: {
            CaseSensitive: false,
          },
          UserPoolName: {
            Ref: 'AWS::StackName',
          },
        },
      },
      [CognitoUserPoolClientLogicalId]: {
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

  if (identityPool) {
    /**
     * https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-cognito-identitypool.html
     */
    template.Resources[CognitoIdentityPoolLogicalId] = {
      Type: 'AWS::Cognito::IdentityPool',
      Properties: {
        AllowUnauthenticatedIdentities: true,
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

    /**
     * https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-cognito-identitypoolroleattachment.html
     */
    template.Resources.CognitoIdentityPoolRoleAttachment = {
      Type: 'AWS::Cognito::IdentityPoolRoleAttachment',
      Properties: {
        IdentityPoolId: {
          Ref: CognitoIdentityPoolLogicalId,
        },
        Roles: roles,
      },
    };

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
