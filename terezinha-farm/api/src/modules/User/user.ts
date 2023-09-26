/* eslint-disable @typescript-eslint/no-explicit-any */
import { QueryUserArgs } from '../../../schema/types';
import { ResolverResolveParams } from '@ttoss/graphql-api';

export const findUserById = ({
  args,
}: ResolverResolveParams<any, any, QueryUserArgs>) => {
  return { id: args.id, name: 'John Doe' };
};
