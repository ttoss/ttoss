import { createApiTemplate } from '@ttoss/appsync-api';

import { schemaComposer } from './schemaComposer';

const template = createApiTemplate({
  schemaComposer,
  /**
   * AWS_IAM allows backend Lambda functions to trigger mutations (e.g. to push
   * real-time events via subscriptions) using IAM credentials instead of a
   * Cognito token. The Lambda execution role must have `appsync:GraphQL`
   * permission on this API.
   */
  additionalAuthenticationProviders: ['AWS_IAM'],
  customDomain: {
    domainName: 'api.terezinha-farm.ttoss.dev',
    certificateArn:
      'arn:aws:acm:us-east-1:483684946879:certificate/c7608b43-720e-49fb-b75b-d3d492ef121a',
    hostedZoneName: 'ttoss.dev.',
  },
  dataSource: {
    roleArn: {
      'Fn::ImportValue':
        'TerezinhaFarmIam-Production:AppSyncLambdaDataSourceIAMRoleArn',
    },
  },
  lambdaFunction: {
    layers: [
      {
        'Fn::ImportValue': 'LambdaLayer-Graphql-16-8-1',
      },
    ],
    roleArn: {
      'Fn::ImportValue':
        'TerezinhaFarmIam-Production:AppSyncLambdaFunctionIAMRoleArn',
    },
  },
  /**
   * NONE data-source resolvers: AppSync passes the mutation arguments directly
   * through to subscribers without invoking a Lambda. Used for real-time
   * subscription triggers.
   */
  noneDataSourceResolvers: [
    { typeName: 'Mutation', fieldName: 'publishFarmNotification' },
  ],
  userPoolConfig: {
    appIdClientRegex: {
      'Fn::ImportValue': 'TerezinhaFarmAuth-Production:AppClientId',
    },
    awsRegion: {
      'Fn::ImportValue': 'TerezinhaFarmAuth-Production:Region',
    },
    defaultAction: 'ALLOW',
    userPoolId: {
      'Fn::ImportValue': 'TerezinhaFarmAuth-Production:UserPoolId',
    },
  },
});

export default template;
