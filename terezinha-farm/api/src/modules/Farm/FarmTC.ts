import { schemaComposer } from '@ttoss/graphql-api';

export const FarmTC = schemaComposer.createObjectTC({
  name: 'Farm',
  fields: {
    id: 'ID!',
    name: 'String!',
  },
});

export const UserTC = schemaComposer.createObjectTC({
  name: 'User',
  fields: {
    sub: 'String!',
    iss: 'String!',
    token_use: 'String!',
    client_id: 'String!',
    username: 'String!',
  },
});
