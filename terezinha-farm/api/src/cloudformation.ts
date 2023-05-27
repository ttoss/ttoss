import { createApiTemplate } from '@ttoss/appsync-api';
import { schemaComposer } from './schemaComposer';

const template = createApiTemplate({
  schemaComposer,
  dataSource: {
    roleArn: {
      'Fn::ImportValue':
        'TerezinhaFarmIam-Production:AppSyncLambdaDataSourceIAMRoleArn',
    },
  },
  lambdaFunction: {
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
