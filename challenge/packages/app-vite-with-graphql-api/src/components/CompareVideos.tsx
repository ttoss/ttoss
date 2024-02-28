import { Grid } from '@ttoss/ui';
import { VideoCard } from './VideoCard';

const videos = [
  // {
  //   title: 'Magnus Carlsen JOGA O QUE ELE QUISER',
  //   url: 'https://www.youtube.com/watch?v=MuqpbBZ9faY',
  // },
  {
    title: 'Naruto And Sasuke Vs Momoshiki Full Fight Hd [ ENGLISH DUB ]',
    src: 'https://www.youtube.com/embed/W5zHwWRILRI?si=Mn3IfZMMued1Du0q',
    rating: 1230,
  },
  // {
  //   title: 'GUNSHIP - When You Grow up, Your Heart Dies',
  //   url: 'https://www.youtube.com/watch?v=o6D-v8QUoLw',
  // },
  {
    title: 'Tony Anderson - Finding Your Heart',
    src: 'https://www.youtube.com/embed/5fbBxegAN-g?si=S55wJECH9wN0che6',
    rating: 1230,
  },
];

export const CompareVideos = () => {
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
      <VideoCard gridIndex={0} {...videos[0]} />
      <VideoCard gridIndex={1} {...videos[1]} />
    </Grid>
  );
};
