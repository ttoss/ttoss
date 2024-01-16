import { FarmTC, UserTC } from './FarmTC';
import { QueryfarmsArgs } from '../../../schema/types';
import {
  ResolverResolveParams,
  composeWithConnection,
  schemaComposer,
} from '@ttoss/graphql-api';

FarmTC.addResolver({
  name: 'findMany',
  type: FarmTC,
  resolve: async ({
    args,
    rawQuery,
  }: ResolverResolveParams<
    unknown,
    unknown,
    QueryfarmsArgs & { limit: number }
  >) => {
    if (rawQuery.id?.$lt) {
      return [...new Array(args.limit)]
        .map((_, index) => {
          const id = Number(rawQuery.id.$lt || 0) - index - 1;
          return {
            id,
            name: `Farm ${id}`,
          };
        })
        .filter((farm) => {
          return farm.id > 0;
        });
    }
    return [...new Array(args.limit)]
      .map((_, index) => {
        const id = index + 1 + Number(rawQuery.id?.$gt || 0);
        return {
          id,
          name: `Farm ${id}`,
        };
      })
      .filter((farm) => {
        return farm.id < 100;
      });
  },
});

FarmTC.addResolver({
  name: 'count',
  type: 'Int!',
  resolve: async () => {
    return 99;
  },
});

composeWithConnection(FarmTC, {
  findManyResolver: FarmTC.getResolver('findMany'),
  countResolver: FarmTC.getResolver('count'),
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

schemaComposer.Query.addFields({
  farms: FarmTC.getResolver('connection'),
});

schemaComposer.Query.addFields({
  getUser: UserTC.getResolver('findById'),
});
