import { schemaComposer } from '@ttoss/graphql-api';

export const FarmNotificationTC = schemaComposer.createObjectTC({
  name: 'FarmNotification',
  fields: {
    farmId: 'ID!',
    message: 'String!',
  },
});
