import { schemaComposer } from '@ttoss/graphql-api';

export const FarmTC = schemaComposer.createObjectTC({
  name: 'Farm',
  fields: {
    id: 'ID!',
    name: 'String!',
  },
});
