import { createApiTemplate, schemaComposer } from '../src';

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

  const template = createApiTemplate({ schemaComposer });

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
