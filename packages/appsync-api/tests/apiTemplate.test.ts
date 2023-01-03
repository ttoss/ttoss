import { getPackageLambdaLayerStackName } from 'carlin/src/deploy/lambdaLayer/getPackageLambdaLayerStackName';

jest.mock('carlin/src/utils/packageJson', () => {
  return {
    readPackageJson: () => {
      return {
        dependencies: {
          '@ttoss/appsync-api': '^1.2.3',
        },
      };
    },
  };
});

import { AppSyncLambdaFunctionLogicalId } from '../src/createApiTemplate';
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

test('should import @ttoss/appsync-api lambda layer', () => {
  const template = createApiTemplate({
    ...createApiTemplateInput,
    schemaComposer,
  });

  const layers =
    template.Resources[AppSyncLambdaFunctionLogicalId].Properties.Layers;

  const layer = layers.find((l: any) => {
    return (
      l['Fn::ImportValue'] ===
      getPackageLambdaLayerStackName('@ttoss/appsync-api@^1.2.3')
    );
  });

  expect(layer).toBeDefined();
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
