import { CompareVideosQuery } from './__generated__/CompareVideosQuery.graphql';
import { Grid } from '@ttoss/ui';
import { VideoCard } from './VideoCard';
import { graphql, useLazyLoadQuery } from 'react-relay';

export const CompareVideos = () => {
  const data = useLazyLoadQuery<CompareVideosQuery>(
    graphql`
      query CompareVideosQuery {
        videosToCompare {
          video0 {
            title
            src
            rating
          }
          video1 {
            title
            src
            rating
          }
        }
      }
    `,
    {}
  );

  return (
    <Grid
      sx={{
        gridTemplateColumns: '1fr 1fr',
        gridTemplateAreas: `
          'title0 title1'
          'rating0 rating1'
          'video0 video1'
          'button0 button1'
        `,
        columnGap: '2xl',
        rowGap: 'lg',
        justifyItems: 'center',
      }}
    >
      <VideoCard gridIndex={0} {...data.videosToCompare.video0} />
      <VideoCard gridIndex={1} {...data.videosToCompare.video1} />
    </Grid>
  );
};
