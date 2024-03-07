import { schemaComposer } from '@ttoss/graphql-api';

export const VideoTC = schemaComposer.createObjectTC({
  name: 'Video',
  fields: {
    id: 'ID!',
    title: 'String!',
    url: 'String!',
    src: 'String!',
    rating: 'Int!',
  },
});
