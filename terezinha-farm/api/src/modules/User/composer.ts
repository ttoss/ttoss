import { ResolverResolveParams, schemaComposer } from '@ttoss/graphql-api';

import { QueryuserArgs } from '../../../schema/types';
import { UserTC } from './UserTC';

const findUserById = ({
  args,
}: ResolverResolveParams<null, null, QueryuserArgs>) => {
  return { id: args.id, name: 'John Doe' };
};

UserTC.addResolver({
  name: 'findUserById',
  type: UserTC,
  args: { id: 'ID!' },
  resolve: findUserById,
});

schemaComposer.Query.addFields({
  user: UserTC.getResolver('findUserById'),
});
