import { PASSWORD_MINIMUM_LENGTH } from './config';

const CognitoUserPoolLogicalId = 'CognitoUserPool';

const CognitoUserPoolClientLogicalId = 'CognitoUserPoolClient';

const CognitoIdentityPoolLogicalId = 'CognitoIdentityPool';

export const createAuthTemplate = () => {
  const template = {
    Resources: {
      [CognitoUserPoolLogicalId]: {
        Type: 'AWS::Cognito::UserPool',
        Properties: {
          AutoVerifiedAttributes: ['email'],
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
      /**
       * https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-cognito-identitypool.html
       */
      [CognitoIdentityPoolLogicalId]: {
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
      },
      /**
       * https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-cognito-identitypoolroleattachment.html
       */
      // CognitoIdentityPoolRoleAttachment: {
      //   Type: 'AWS::Cognito::IdentityPoolRoleAttachment',
      //   Properties: {
      //     IdentityPoolId: {
      //       Ref: CognitoIdentityPoolLogicalId,
      //     },
      //   },
      // },
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
      IdentityPoolId: {
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
      },
    },
  };

  return template;
};
