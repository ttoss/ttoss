jest.mock('carlin/src/utils/packageJson', () => {
  return {
    readPackageJson: () => {
      return {
        dependencies: {
          graphql: '^16.6.0',
          'graphql-compose': '^9.0.10',
        },
      };
    },
  };
});

import {
  AppSyncGraphQLApiKeyLogicalId,
  AppSyncGraphQLApiLogicalId,
  AppSyncLambdaFunctionLogicalId,
} from '../src/createApiTemplate';
import { createApiTemplate, schemaComposer } from '../src';

const createApiTemplateInput = {
  schemaComposer,
  dataSource: {
    roleArn: 'arn:aws:iam::123456789012:role/role',
  },
  lambdaFunction: {
    roleArn: 'arn:aws:iam::123456789012:role/role',
  },
};

test('export graphql api arn', () => {
  const template = createApiTemplate(createApiTemplateInput);

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
    apiKey: true,
  });

  /**
   * Default AuthenticationType to AWS_IAM.
   */
  expect(
    template.Resources[AppSyncGraphQLApiLogicalId].Properties[
      'AuthenticationType'
    ]
  ).toEqual('AWS_IAM');

  expect(
    template.Resources[AppSyncGraphQLApiLogicalId].Properties[
      'AdditionalAuthenticationProvider'
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
    schemaComposer,
  });

  const layers =
    template.Resources[AppSyncLambdaFunctionLogicalId].Properties.Layers;

  expect(layers).toMatchObject([
    {
      'Fn::ImportValue': 'LambdaLayer-Graphql-16-6-0',
    },
    {
      'Fn::ImportValue': 'LambdaLayer-GraphqlCompose-9-0-10',
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
