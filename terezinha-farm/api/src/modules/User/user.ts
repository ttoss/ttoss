import { ResolverResolveParams } from '@ttoss/graphql-api';

export const findUserById = ({
  args,
}: ResolverResolveParams<any, any, { id: string }>) => {
  return { id: args.id, name: 'John Doe' };
};
