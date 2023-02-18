import { InterfaceTypeComposer, type SchemaComposer } from 'graphql-compose';

const NodeTC = InterfaceTypeComposer.createTemp({
  name: 'Node',
  description:
    'An object, that can be fetched by the globally unique ID among all types.',
  fields: {
    id: {
      type: 'ID!',
      description: 'The globally unique ID among all types.',
    },
  },
  resolveType: (payload: any) => {
    // `payload.__nodeType` was added to payload via nodeFieldConfig.resolve
    return payload.__nodeType.name ? payload.__nodeType.name : null;
  },
});

export const NodeInterface = NodeTC.getType();

export const getNodeInterface = <TContext>(
  sc: SchemaComposer<TContext>
): InterfaceTypeComposer<any, TContext> => {
  if (sc.hasInstance('Node', InterfaceTypeComposer)) {
    return sc.get('Node') as any;
  }

  sc.set('Node', NodeTC);

  return NodeTC;
};
