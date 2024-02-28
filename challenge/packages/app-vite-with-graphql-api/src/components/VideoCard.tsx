import { Box, Button, Heading, Text } from '@ttoss/ui';
import { YouTubeEmbed } from './YouTubeEmbed';

export const VideoCard = (props: {
  title: string;
  src: string;
  rating: number;
  gridIndex: number;
}) => {
  return (
    <>
      <Heading
        as="h2"
        sx={{
          gridArea: `title${props.gridIndex}`,
        }}
      >
        {props.title}
      </Heading>
      <Text
        sx={{
          gridArea: `rating${props.gridIndex}`,
          fontSize: 'lg',
        }}
      >
        Rating:{' '}
        <Text
          sx={{
            fontWeight: 'bold',
          }}
        >
          {props.rating}
        </Text>
      </Text>
      <Box
        sx={{
          gridArea: `video${props.gridIndex}`,
        }}
      >
        <YouTubeEmbed src={props.src} />
      </Box>
      <Button
        sx={{
          gridArea: `button${props.gridIndex}`,
        }}
        variant="primary"
      >
        Winner
      </Button>
    </>
  );
};
