import { type MutationvideosContestArgs } from '../../../schema/types';
import { type ResolverResolveParams, schemaComposer } from '@ttoss/graphql-api';
import { VideoTC } from './VideoTC';

const VideosContestTC = schemaComposer.createObjectTC({
  name: 'VideosContest',
  fields: {
    winner: VideoTC.NonNull,
    loser: VideoTC.NonNull,
  },
});

VideoTC.addResolver({
  name: 'videosContest',
  type: VideosContestTC.NonNull,
  args: {
    winnerId: 'ID!',
    loserId: 'ID!',
  },
  description:
    'Get the winner and loser id of a contest between two videos, and return both videos with their updated ratings.',
  resolve: async ({
    args,
  }: ResolverResolveParams<unknown, unknown, MutationvideosContestArgs>) => {
    /**
     * TODO: Implement a function to resolve the mutation and return the result.
     * You can implement the Elo rating algorithm to calculate the new ratings
     * of the winner and loser videos.
     * https://en.wikipedia.org/wiki/Elo_rating_system
     */
    // eslint-disable-next-line no-console
    console.log(args);
    return {};
  },
});

schemaComposer.Mutation.addFields({
  videosContest: VideoTC.getResolver('videosContest'),
});
