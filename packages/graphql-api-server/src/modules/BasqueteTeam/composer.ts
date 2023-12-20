import {
  ResolverResolveParams,
  composeWithConnection,
  schemaComposer,
} from '@ttoss/graphql-api';

const BasqueteTeam = schemaComposer.createObjectTC({
  name: 'BasqueteTeam',
  fields: {
    id: 'ID!',
    name: 'String!',
  },
});

BasqueteTeam.addResolver({
  name: 'findById',
  type: BasqueteTeam,
  args: {
    id: 'ID!',
  },
});

BasqueteTeam.addResolver({
  name: 'findMany',
  type: BasqueteTeam,
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
            name: `BasqueteTeam ${id}`,
          };
        })
        .filter((basquete) => {
          return basquete.id > 0;
        });
    }

    return [...new Array(args.limit)]
      .map((_, index) => {
        const id = index + 1 + Number(rawQuery.id?.$gt || 0);
        return {
          id,
          name: `BasqueteTeam ${id}`,
        };
      })
      .filter((basquete) => {
        return basquete.id < 100;
      });
  },
});

BasqueteTeam.addResolver({
  name: 'count',
  type: 'Int!',
  resolve: async () => {
    return 99;
  },
});

composeWithConnection(BasqueteTeam, {
  findManyResolver: BasqueteTeam.getResolver('findMany'),
  countResolver: BasqueteTeam.getResolver('count'),
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
  basquete: BasqueteTeam.getResolver('connection'),
});
