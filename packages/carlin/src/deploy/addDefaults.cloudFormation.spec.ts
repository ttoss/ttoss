import { CloudFormationTemplate } from '../utils/cloudFormationTemplate';

import { addDefaults } from './addDefaults.cloudFormation';

describe('testing template update', () => {
  test.each<[string, CloudFormationTemplate, Partial<CloudFormationTemplate>]>([
    [
      'add AppSync outputs',
      {
        AWSTemplateFormatVersion: '2010-09-09',
        Resources: {
          AppSyncGraphQLApi: {
            Type: 'AWS::AppSync::GraphQLApi',
            Properties: {},
          },
        },
      },
      {
        Outputs: {
          AppSyncGraphQLApi: {
            Description: expect.any(String),
            Value: { 'Fn::GetAtt': ['AppSyncGraphQLApi', 'GraphQLUrl'] },
            Export: {
              Name: {
                'Fn::Join': [':', [{ Ref: 'AWS::StackName' }, 'GraphQLApiUrl']],
              },
            },
          },
        },
      },
    ],
  ])('%s', async (_, template, newTemplate) => {
    const params = { StackName: 'stackName' };
    expect((await addDefaults({ params, template })).template).toEqual(
      expect.objectContaining(newTemplate),
    );
  });
});
