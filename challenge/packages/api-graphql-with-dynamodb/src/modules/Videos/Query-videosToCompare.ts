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
  resolve: async () => {
    return {
      video0: {
        id: '1',
        title: 'Naruto And Sasuke Vs Momoshiki Full Fight Hd [ ENGLISH DUB ]',
        src: 'https://www.youtube.com/embed/W5zHwWRILRI?si=Mn3IfZMMued1Du0q',
        rating: 3000,
      },
      video1: {
        id: '2',
        title: 'Tony Anderson - Finding Your Heart',
        src: 'https://www.youtube.com/embed/5fbBxegAN-g?si=S55wJECH9wN0che6',
        rating: 1230,
      },
    };
  },
});

schemaComposer.Query.addFields({
  videosToCompare: VideoTC.getResolver('videosToCompare'),
});
