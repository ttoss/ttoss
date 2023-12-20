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

schemaComposer.Query.addFields({
  author: AuthorTC.getResolver('connection'),
});

export { schemaComposer };
