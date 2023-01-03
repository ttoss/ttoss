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
});

export default template;
