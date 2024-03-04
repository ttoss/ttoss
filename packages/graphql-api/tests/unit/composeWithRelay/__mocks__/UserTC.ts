/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql-compose/lib/graphql';
import { fromGlobalId } from '@ttoss/ids';
import { schemaComposer } from 'graphql-compose';

export const UserType = new GraphQLObjectType({
  name: 'User',
  fields: {
    id: {
      type: GraphQLInt,
    },
    name: {
      type: GraphQLString,
    },
    nickname: {
      type: GraphQLString,
    },
  },
});

export const UserTC = schemaComposer.createObjectTC(UserType);

UserTC.setRecordIdFn((obj) => {
  return obj.id;
});

export const findByIdResolver = schemaComposer.createResolver({
  name: 'findById',
  kind: 'query',
  type: UserType,
  args: {
    id: 'ID!',
  },
  resolve: (resolveParams: any) => {
    const args = resolveParams.args || {};

    const { recordId } = fromGlobalId(args.id);

    if (recordId.toString() === '1') {
      return Promise.resolve({
        id: 1,
        name: 'Pavel',
        nickname: '@nodkz',
      });
    }

    if (recordId.toString() === '2') {
      return Promise.resolve({
        id: 2,
        name: 'Lee',
        nickname: '@leeb',
      });
    }

    return Promise.resolve(null);
  },
});

UserTC.setResolver('findById', findByIdResolver);

export const createOneResolver = schemaComposer.createResolver({
  name: 'createOne',
  kind: 'mutation',
  type: new GraphQLObjectType({
    name: 'UserPayload',
    fields: {
      record: {
        type: UserType,
      },
    },
  }),
  args: {
    input: {
      name: 'input',
      type: new GraphQLInputObjectType({
        name: 'UserInput',
        fields: {
          name: {
            type: GraphQLString,
          },
        },
      }),
    },
  },
  resolve: (resolveParams: any) => {
    return Promise.resolve({
      recordId: resolveParams.args.input.id,
      record: (resolveParams.args && resolveParams.args.input) || {},
    });
  },
});

UserTC.setResolver('createOne', createOneResolver);

export const manyArgsWithInputResolver = schemaComposer.createResolver({
  name: 'manyArgsWithInput',
  kind: 'mutation',
  type: new GraphQLObjectType({
    name: 'UserPayload',
    fields: {
      record: {
        type: UserType,
      },
    },
  }),
  args: {
    input: {
      name: 'input',
      type: new GraphQLInputObjectType({
        name: 'UserInput',
        fields: {
          name: {
            type: GraphQLString,
          },
        },
      }),
    },
    sort: {
      name: 'sort',
      type: GraphQLString,
    },
    limit: {
      name: 'limit',
      type: GraphQLInt,
    },
  },
  resolve: (resolveParams: any) => {
    return Promise.resolve({
      recordId: resolveParams.args.input.id,
      record: (resolveParams.args && resolveParams.args.input) || {},
    });
  },
});

UserTC.setResolver('manyArgsWithInput', manyArgsWithInputResolver);

export const manyArgsWithoutInputResolver = schemaComposer.createResolver({
  name: 'manyArgsWithoutInput',
  kind: 'mutation',
  type: new GraphQLObjectType({
    name: 'UserPayload',
    fields: {
      record: {
        type: UserType,
      },
    },
  }),
  args: {
    sort: {
      name: 'sort',
      type: GraphQLString,
    },
    limit: {
      name: 'limit',
      type: GraphQLInt,
    },
  },
  resolve: (resolveParams: any) => {
    return Promise.resolve({
      recordId: resolveParams.args.input.id,
      record: (resolveParams.args && resolveParams.args.input) || {},
    });
  },
});

UserTC.setResolver('manyArgsWithoutInput', manyArgsWithoutInputResolver);
