import { GraphQLError } from 'graphql';
import {
  ResolverResolveParams,
  composeWithConnection,
  schemaComposer,
} from '@ttoss/graphql-api';

const AuthorTC = schemaComposer.createObjectTC({
  name: 'Author',
  fields: {
    id: 'Int!',
    name: 'String!',
  },
});

export const UserTC = schemaComposer.createObjectTC({
  name: 'User',
  fields: {
    sub: 'String!',
    iss: 'String!',
    token_use: 'String!',
    client_id: 'String!',
    username: 'String!',
  },
});

AuthorTC.addResolver({
  name: 'findMany',
  type: AuthorTC,
  resolve: async ({
    args,
    rawQuery,
  }: ResolverResolveParams<unknown, unknown, { limit: number }>) => {
    if (rawQuery.id?.$lt) {
      return [...new Array(args.limit)]
        .map((_, index) => {
          const id = Number(rawQuery.id.$lt || 0) - index - 1;
          return {
            id,
            name: `Author ${id}`,
          };
        })
        .filter((author) => {
          return author.id > 0;
        });
    }

    return [...new Array(args.limit)]
      .map((_, index) => {
        const id = index + 1 + Number(rawQuery.id?.$gt || 0);
        return {
          id,
          name: `Author ${id}`,
        };
      })
      .filter((author) => {
        return author.id < 100;
      });
  },
});

AuthorTC.addResolver({
  name: 'count',
  type: 'Int!',
  resolve: async () => {
    return 99;
  },
});

composeWithConnection(AuthorTC, {
  findManyResolver: AuthorTC.getResolver('findMany'),
  countResolver: AuthorTC.getResolver('count'),
  defaultLimit: 10,
  sort: {
    ID_ASC: {
      value: {},
      cursorFields: ['id'],
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, max-params
      beforeCursorQuery: (rawQuery, cursorData, resolveParams) => {
        if (!rawQuery.id) {
          rawQuery.id = {};
        }
        rawQuery.id.$lt = cursorData.id;
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, max-params
      afterCursorQuery: (rawQuery, cursorData, resolveParams) => {
        if (!rawQuery.id) {
          rawQuery.id = {};
        }
        rawQuery.id.$gt = cursorData.id;
      },
    },
  },
});

schemaComposer.Mutation.addFields({
  createAuthor: {
    type: AuthorTC,
    args: {
      id: 'ID!',
      name: 'String!',
    },
  },
});

AuthorTC.addResolver({
  name: 'createAuthor',
  type: AuthorTC,
  args: {
    id: 'ID!', // Defina os tipos dos argumentos conforme necessário
    name: 'String!',
  },
  resolve: async ({
    args,
  }: ResolverResolveParams<unknown, unknown, { id: string; name: string }>) => {
    const { id, name } = args;
    const newAuthor = {
      id,
      name,
    };

    return newAuthor;
  },
});

UserTC.addResolver({
  name: 'findById',
  type: UserTC,
  args: {
    token: 'String!',
  },
  resolve: async ({
    args,
  }: ResolverResolveParams<
    unknown,
    unknown,
    { sub: string; token_use: string; client_id: string; username: string }
  >) => {
    const mockUserData = {
      sub: args.sub,
      token_use: args.token_use,
      client_id: args.client_id,
      username: args.username,
    };

    return mockUserData;
  },
});

UserTC.addResolver({
  name: 'findById',
  type: UserTC,
  resolve: async ({
    context,
  }: ResolverResolveParams<
    unknown,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any,
    { sub: string; token_use: string; client_id: string; username: string }
  >) => {
    const mockUserData = {
      sub: context.identity.sub,
      iss: context.identity.iss,
      token_use: context.identity.token_use,
      client_id: context.identity.client_id,
      username: context.identity.username,
    };

    return mockUserData;
  },
});

UserTC.addResolver({
  name: 'findByIdWithError',
  type: UserTC,
  resolve: async () => {
    throw new GraphQLError('findByIdWithError error');
  },
});

schemaComposer.Query.addFields({
  author: AuthorTC.getResolver('connection'),
});

schemaComposer.Mutation.addFields({
  createAuthor: AuthorTC.getResolver('createAuthor'),
});

schemaComposer.Query.addFields({
  getUser: UserTC.getResolver('findById'),
  getUserWithError: UserTC.getResolver('findByIdWithError'),
});

export { schemaComposer };
