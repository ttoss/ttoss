import { schemaComposer } from '@ttoss/graphql-api';

const VideoTC = schemaComposer.createObjectTC({
  name: 'Video',
  fields: {
    id: 'ID!',
    name: 'String!',
  },
});

VideoTC.addResolver({
  name: 'findById',
  type: VideoTC,
  args: { id: 'ID!' },
  resolve: () => {
    return {
      id: '1',
      name: 'video1',
    };
  },
});

schemaComposer.Query.addFields({
  video: VideoTC.getResolver('findById'),
});

export { schemaComposer };
