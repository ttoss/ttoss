import { createApiTemplate } from '@ttoss/appsync-api';
import { schemaComposer } from './schemaComposer';

const template = createApiTemplate({
  schemaComposer,
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

// eslint-disable-next-line import/no-default-export
export default template;
