import { VideoTC } from './VideoTC';
import { schemaComposer } from '@ttoss/graphql-api';

const VideosToCompareTC = schemaComposer.createObjectTC({
  name: 'VideosToCompare',
  fields: {
    video0: VideoTC.NonNull,
    video1: VideoTC.NonNull,
  },
});

VideoTC.addResolver({
  name: 'videosToCompare',
  type: VideosToCompareTC.NonNull,
  description: 'Get two videos to compare.',
  resolve: async () => {
    /**
     * TODO: Implement the resolver to get two videos to compare.
     */
    return {};
  },
});

schemaComposer.Query.addFields({
  videosToCompare: VideoTC.getResolver('videosToCompare'),
});
