/* eslint-disable @typescript-eslint/no-explicit-any */
import { QueryuserArgs } from '../../../schema/types';
import { ResolverResolveParams } from '@ttoss/graphql-api';

export const findUserById = ({
  args,
}: ResolverResolveParams<any, any, QueryuserArgs>) => {
  return { id: args.id, name: 'John Doe' };
};
