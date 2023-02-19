import { createApiTemplate } from '../../src';
import { schemaComposer } from '../schemaComposer';

const template = createApiTemplate({
  schemaComposer,
  dataSource: {
    roleArn: 'arn:aws:iam::123456789012:role/role',
  },
  lambdaFunction: {
    roleArn: 'arn:aws:iam::123456789012:role/role',
  },
  userPoolConfig: {
    appIdClientRegex:
      'arn:aws:cognito-idp:us-east-1:123456789012:userpool/us-east-1_123456789',
    awsRegion: 'us-east-1',
    defaultAction: 'ALLOW' as const,
    userPoolId: 'us-east-1_123456789',
  },
});

test('should not add enum resolvers to template', () => {
  Object.values(template.Resources).forEach((resource) => {
    if (resource.Type !== 'AWS::AppSync::Resolver') {
      return;
    }

    expect(resource.Properties.TypeName).not.toMatch(/enum/i);
  });
});
