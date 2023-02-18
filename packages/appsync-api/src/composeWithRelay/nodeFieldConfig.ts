import {
  type InterfaceTypeComposer,
  type ObjectTypeComposerFieldConfigDefinition,
  getProjectionFromAST,
} from 'graphql-compose';
import { fromGlobalId } from './globalId';
import type { GraphQLResolveInfo } from 'graphql-compose/lib/graphql';
import type { ObjectTypeComposer, Resolver } from 'graphql-compose';

export type TypeMapForRelayNode<TSource, TContext> = {
  [typeName: string]: {
    resolver: Resolver<TSource, TContext>;
    tc: ObjectTypeComposer<TSource, TContext>;
  };
};

// this fieldConfig must be set to RootQuery.node field
export const getNodeFieldConfig = (
  typeMapForRelayNode: TypeMapForRelayNode<any, any>,
  nodeInterface: InterfaceTypeComposer<any, any>
): ObjectTypeComposerFieldConfigDefinition<any, any> => {
  return {
    description:
      'Fetches an object that has globally unique ID among all types',
    type: nodeInterface,
    args: {
      id: {
        type: 'ID!',
        description: 'The globally unique ID among all types',
      },
    },
    resolve: (
      source: any,
      args: { [argName: string]: any },
      context: any,
      info: GraphQLResolveInfo
    ) => {
      if (!args.id || !(typeof args.id === 'string')) {
        return null;
      }
      const { type } = fromGlobalId(args.id);

      if (!typeMapForRelayNode[type]) {
        return null;
      }
      const { tc, resolver: findById } = typeMapForRelayNode[type];
      if (findById && findById.resolve && tc) {
        const graphqlType = tc.getType();

        // set `returnType` for proper work of `getProjectionFromAST`
        // it will correctly add required fields for `relation` to `projection`
        let projection;
        if (info) {
          projection = getProjectionFromAST({
            ...info,
            returnType: graphqlType,
          });
        } else {
          projection = {};
        }

        // suppose that first argument is argument with id field
        const idArgName = Object.keys(findById.args)[0];
        return findById
          .resolve({
            source,
            args: { [idArgName]: args.id }, // eg. mongoose has _id fieldname, so should map
            context,
            info,
            projection,
          })
          .then((res: any) => {
            if (!res) return res;
            res.__nodeType = graphqlType;
            return res;
          });
      }

      return null;
    },
  };
};
