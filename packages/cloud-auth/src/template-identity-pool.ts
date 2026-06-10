import type { CloudFormationTemplate, Policy } from '@ttoss/cloudformation';

const DenyStatement = {
  Effect: 'Deny' as const,
  Action: ['*'],
  Resource: ['*'],
};

const CognitoUserPoolLogicalId = 'CognitoUserPool';
const CognitoUserPoolClientLogicalId = 'CognitoUserPoolClient';
const CognitoIdentityPoolLogicalId = 'CognitoIdentityPool';

export const IdentityPoolAuthenticatedIAMRoleLogicalId =
  'IdentityPoolAuthenticatedIAMRole';

export const IdentityPoolUnauthenticatedIAMRoleLogicalId =
  'IdentityPoolUnauthenticatedIAMRole';

export type IdentityPoolConfig = {
  enabled?: boolean;
  name?: string;
  allowUnauthenticatedIdentities?: boolean;
  authenticatedRoleArn?: string;
  authenticatedPolicies?: Policy[];
  unauthenticatedRoleArn?: string;
  unauthenticatedPolicies?: Policy[];
  principalTags?: Record<string, string> | boolean;
};

const buildAuthenticatedRoleResource = (policies?: Policy[]) => {
  return {
    Type: 'AWS::IAM::Role',
    Properties: {
      AssumeRolePolicyDocument: {
        Version: '2012-10-17' as const,
        Statement: [
          {
            Effect: 'Allow' as const,
            Principal: { Federated: 'cognito-identity.amazonaws.com' },
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
      Policies: policies || [
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
};

const buildUnauthenticatedRoleResource = (policies?: Policy[]) => {
  return {
    Type: 'AWS::IAM::Role',
    Properties: {
      AssumeRolePolicyDocument: {
        Version: '2012-10-17' as const,
        Statement: [
          {
            Effect: 'Allow' as const,
            Principal: { Federated: 'cognito-identity.amazonaws.com' },
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
      Policies: policies || [
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
};

export const defaultPrincipalTags = {
  appClientId: 'aud',
  userId: 'sub',
};

const applyIdentityPoolPrincipalTags = (
  template: CloudFormationTemplate,
  principalTags: IdentityPoolConfig['principalTags']
) => {
  if (principalTags === false) return;

  const PrincipalTags =
    !principalTags || typeof principalTags === 'boolean'
      ? defaultPrincipalTags
      : principalTags;

  template.Resources.CognitoIdentityPoolPrincipalTag = {
    Type: 'AWS::Cognito::IdentityPoolPrincipalTag',
    Properties: {
      IdentityPoolId: { Ref: CognitoIdentityPoolLogicalId },
      IdentityProviderName: {
        'Fn::GetAtt': [CognitoUserPoolLogicalId, 'ProviderName'],
      },
      PrincipalTags,
      UseDefaults: false,
    },
  };
};

export const applyIdentityPool = (
  template: CloudFormationTemplate,
  identityPool: IdentityPoolConfig
) => {
  template.Resources[CognitoIdentityPoolLogicalId] = {
    Type: 'AWS::Cognito::IdentityPool',
    Properties: {
      AllowUnauthenticatedIdentities:
        identityPool.allowUnauthenticatedIdentities || false,
      CognitoIdentityProviders: [
        {
          ClientId: { Ref: CognitoUserPoolClientLogicalId },
          ProviderName: {
            'Fn::GetAtt': [CognitoUserPoolLogicalId, 'ProviderName'],
          },
        },
      ],
      ...(identityPool.name && { IdentityPoolName: identityPool.name }),
    },
  };

  template.Resources.CognitoIdentityPoolRoleAttachment = {
    Type: 'AWS::Cognito::IdentityPoolRoleAttachment',
    Properties: {
      IdentityPoolId: { Ref: CognitoIdentityPoolLogicalId },
      Roles: {},
    },
  };

  const roles =
    template.Resources.CognitoIdentityPoolRoleAttachment.Properties?.Roles;

  if (identityPool.authenticatedRoleArn) {
    Object.assign(roles, { authenticated: identityPool.authenticatedRoleArn });
  } else {
    template.Resources[IdentityPoolAuthenticatedIAMRoleLogicalId] =
      buildAuthenticatedRoleResource(identityPool.authenticatedPolicies);
    Object.assign(roles, {
      authenticated: {
        'Fn::GetAtt': [IdentityPoolAuthenticatedIAMRoleLogicalId, 'Arn'],
      },
    });
  }

  if (identityPool.unauthenticatedRoleArn) {
    Object.assign(roles, {
      unauthenticated: identityPool.unauthenticatedRoleArn,
    });
  } else {
    template.Resources[IdentityPoolUnauthenticatedIAMRoleLogicalId] =
      buildUnauthenticatedRoleResource(identityPool.unauthenticatedPolicies);
    Object.assign(roles, {
      unauthenticated: {
        'Fn::GetAtt': [IdentityPoolUnauthenticatedIAMRoleLogicalId, 'Arn'],
      },
    });
  }

  applyIdentityPoolPrincipalTags(template, identityPool.principalTags);

  template.Outputs = {
    ...template.Outputs,
    IdentityPoolId: {
      Description: 'You use this value on Amplify Auth `identityPoolId`.',
      Value: { Ref: CognitoIdentityPoolLogicalId },
      Export: {
        Name: {
          'Fn::Join': [
            ':',
            [{ Ref: 'AWS::StackName' }, 'CognitoIdentityPoolId'],
          ],
        },
      },
    },
  };
};
