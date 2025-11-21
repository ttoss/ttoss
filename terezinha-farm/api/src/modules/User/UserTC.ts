import { schemaComposer } from '@ttoss/graphql-api';

export const UserTC = schemaComposer.createObjectTC({
  name: 'User',
  fields: {
    id: 'ID!',
    email: 'String!',
  },
});
