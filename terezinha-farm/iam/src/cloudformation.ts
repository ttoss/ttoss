import { createRolesTemplate } from '@ttoss/cloud-roles';

const template = createRolesTemplate({
  resources: {
    AppSyncLambdaFunctionIAMRole: {
      Type: 'AWS::IAM::Role',
      Properties: {
        AssumeRolePolicyDocument: {
          Version: '2012-10-17' as const,
          Statement: [
            {
              Effect: 'Allow' as const,
              Action: 'sts:AssumeRole',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
        },
        ManagedPolicyArns: [
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
        ],
      },
    },
    AppSyncLambdaDataSourceIAMRole: {
      Type: 'AWS::IAM::Role',
      Properties: {
        AssumeRolePolicyDocument: {
          Version: '2012-10-17' as const,
          Statement: [
            {
              Effect: 'Allow' as const,
              Action: 'sts:AssumeRole',
              Principal: {
                Service: 'appsync.amazonaws.com',
              },
            },
          ],
        },
        ManagedPolicyArns: [
          'arn:aws:iam::aws:policy/service-role/AWSAppSyncPushToCloudWatchLogs',
        ],
        Policies: [
          {
            PolicyName: 'AppSyncGraphQLApiIAMRolePolicyName',
            PolicyDocument: {
              Version: '2012-10-17' as const,
              Statement: [
                {
                  Effect: 'Allow' as const,
                  Action: ['lambda:InvokeFunction'],
                  Resource: '*',
                },
              ],
            },
          },
        ],
      },
    },
    CognitoTriggersLambdaFunctionIAMRole: {
      Type: 'AWS::IAM::Role',
      Properties: {
        AssumeRolePolicyDocument: {
          Version: '2012-10-17' as const,
          Statement: [
            {
              Effect: 'Allow' as const,
              Action: 'sts:AssumeRole',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
        },
        ManagedPolicyArns: [
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
        ],
      },
    },
  },
});

export default template;
