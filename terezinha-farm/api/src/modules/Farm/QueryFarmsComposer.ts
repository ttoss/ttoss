import { FarmTC } from './FarmTC';
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
  }: ResolverResolveParams<
    unknown,
    unknown,
    QueryfarmsArgs & { limit: number }
  >) => {
    if (args.before) {
      return [...new Array(args.limit)]
        .map((_, index) => {
          const id = Number(args.before || 0) - index - 1;
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
        const id = index + 1 + Number(args.after || 0);
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

schemaComposer.Query.addFields({
  farms: FarmTC.getResolver('connection'),
});
