import { findUserById } from './user';
import { schemaComposer } from '@ttoss/appsync-api';

const UserTC = schemaComposer.createObjectTC({
  name: 'User',
  fields: {
    id: 'ID!',
    name: 'String!',
  },
});

UserTC.addResolver({
  name: 'findUserById',
  type: UserTC,
  args: { id: 'ID!' },
  resolve: findUserById,
});

schemaComposer.Query.addFields({
  user: UserTC.getResolver('findUserById'),
});
