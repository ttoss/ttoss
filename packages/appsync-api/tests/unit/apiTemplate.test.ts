import {
  AppSyncGraphQLApiKeyLogicalId,
  AppSyncGraphQLApiLogicalId,
  AppSyncGraphQLSchemaLogicalId,
  AppSyncLambdaFunctionLogicalId,
} from '../../src/createApiTemplate';
import { createApiTemplate } from '../../src';
import { schemaComposer } from '@ttoss/graphql-api';

const createApiTemplateInput = {
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
};

describe('tests with default template', () => {
  const template = createApiTemplate(createApiTemplateInput);

  /**
   * See https://github.com/aws/aws-appsync-community/issues/38
   */
  test('schema should not contain """ comments', () => {
    expect(
      template.Resources[AppSyncGraphQLSchemaLogicalId].Properties.Definition
    ).not.toContain('"""');
  });

  test('should contain UserPoolConfig', () => {
    expect(
      template.Resources[AppSyncGraphQLApiLogicalId].Properties[
        'UserPoolConfig'
      ]
    ).toEqual({
      AppIdClientRegex: createApiTemplateInput.userPoolConfig.appIdClientRegex,
      AwsRegion: createApiTemplateInput.userPoolConfig.awsRegion,
      DefaultAction: createApiTemplateInput.userPoolConfig.defaultAction,
      UserPoolId: createApiTemplateInput.userPoolConfig.userPoolId,
    });
  });

  test('export graphql api arn', () => {
    expect(template?.Outputs?.AppSyncApiArn).toEqual({
      Export: {
        Name: {
          'Fn::Join': [':', [{ Ref: 'AWS::StackName' }, 'AppSyncApiArn']],
        },
      },
      Value: {
        'Fn::GetAtt': [AppSyncGraphQLApiLogicalId, 'Arn'],
      },
    });
  });
});

test('add environment variables to lambda function', () => {
  const variables = {
    VARIABLE_1: 'value1',
    VARIABLE_2: 'value2',
    VARIABLE_3: 'value3',
  };

  const template = createApiTemplate({
    ...createApiTemplateInput,
    lambdaFunction: {
      ...createApiTemplateInput.lambdaFunction,
      environment: { variables },
    },
  });

  expect(
    template.Resources[AppSyncLambdaFunctionLogicalId].Properties.Environment
      .Variables
  ).toEqual(variables);
});

test('create api key', () => {
  const template = createApiTemplate({
    ...createApiTemplateInput,
    additionalAuthenticationProviders: ['API_KEY'],
  });

  /**
   * Default AuthenticationType to AMAZON_COGNITO_USER_POOLS.
   */
  expect(
    template.Resources[AppSyncGraphQLApiLogicalId].Properties[
      'AuthenticationType'
    ]
  ).toEqual('AMAZON_COGNITO_USER_POOLS');

  expect(
    template.Resources[AppSyncGraphQLApiLogicalId].Properties[
      'AdditionalAuthenticationProviders'
    ]
  ).toContainEqual({
    AuthenticationType: 'API_KEY',
  });

  expect(template.Resources[AppSyncGraphQLApiKeyLogicalId]).toEqual({
    Type: 'AWS::AppSync::ApiKey',
    Properties: {
      ApiId: { 'Fn::GetAtt': [AppSyncGraphQLApiLogicalId, 'ApiId'] },
    },
  });
});

test('should import @ttoss/appsync-api lambda layer', () => {
  const template = createApiTemplate({
    ...createApiTemplateInput,
    lambdaFunction: {
      ...createApiTemplateInput.lambdaFunction,
      layers: [
        {
          'Fn::ImportValue': 'LambdaLayer-Graphql-16-6-0',
        },
      ],
    },
    schemaComposer,
  });

  const layers =
    template.Resources[AppSyncLambdaFunctionLogicalId].Properties.Layers;

  expect(layers).toMatchObject([
    {
      'Fn::ImportValue': 'LambdaLayer-Graphql-16-6-0',
    },
  ]);
});

test('should add resolvers to template', () => {
  const idResolver = schemaComposer.createResolver({
    name: 'idResolver',
    type: 'String',
    args: {
      id: 'Int!',
    },
    resolve: async ({ args }) => {
      return args.id;
    },
  });

  schemaComposer.Query.addFields({
    id1: idResolver,
    id2: idResolver,
    idQuery: idResolver,
  });

  schemaComposer.Mutation.addFields({
    id1: idResolver,
    id2: idResolver,
    idMutation: idResolver,
  });

  schemaComposer.Subscription.addFields({
    id1: idResolver,
    id2: idResolver,
    idSubscription: idResolver,
  });

  const typeAndFieldNames = [
    ['Query', 'id1'],
    ['Query', 'id2'],
    ['Query', 'idQuery'],
    ['Mutation', 'id1'],
    ['Mutation', 'id2'],
    ['Mutation', 'idMutation'],
    ['Subscription', 'id1'],
    ['Subscription', 'id2'],
    ['Subscription', 'idSubscription'],
  ];

  const template = createApiTemplate({
    ...createApiTemplateInput,
    schemaComposer,
  });

  const resources = Object.values(template.Resources);

  typeAndFieldNames.forEach(([typeName, fieldName]) => {
    const resource = resources.find((r) => {
      return (
        r.Properties.TypeName === typeName &&
        r.Properties.FieldName === fieldName
      );
    });

    expect(resource).toBeDefined();
  });
});

describe('custom domain name', () => {
  test('should add custom domain name resources to template', () => {
    const input = {
      ...createApiTemplateInput,
      customDomain: {
        domainName: 'example.com',
        certificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/123456',
      },
    };

    const template = createApiTemplate(input);

    expect(template.Resources.AppSyncDomainName).toMatchObject({
      Type: 'AWS::AppSync::DomainName',
      Properties: {
        CertificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/123456',
        DomainName: 'example.com',
      },
    });

    expect(template.Resources.AppSyncDomainNameApiAssociation).toMatchObject({
      Type: 'AWS::AppSync::DomainNameApiAssociation',
      Properties: {
        ApiId: {
          'Fn::GetAtt': [AppSyncGraphQLApiLogicalId, 'ApiId'],
        },
        DomainName: {
          'Fn::GetAtt': ['AppSyncDomainName', 'DomainName'],
        },
      },
    });
  });

  test.each([
    {
      hostedZoneName: 'example.com',
    },
    {
      hostedZoneName: 'example.com.',
    },
  ])('should add record set to Route 53', ({ hostedZoneName }) => {
    const input = {
      ...createApiTemplateInput,
      customDomain: {
        domainName: 'www.example.com',
        certificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/123456',
        hostedZoneName,
      },
    };

    const template = createApiTemplate(input);

    expect(template.Resources.AppSyncDomainNameRoute53RecordSet).toMatchObject({
      Type: 'AWS::Route53::RecordSet',
      Properties: {
        HostedZoneName: 'example.com.',
        Name: 'www.example.com',
        Type: 'CNAME',
        ResourceRecords: [
          {
            'Fn::GetAtt': ['AppSyncDomainName', 'AppSyncDomainName'],
          },
        ],
      },
    });
  });
});
