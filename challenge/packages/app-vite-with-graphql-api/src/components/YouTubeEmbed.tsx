import { Box } from '@ttoss/ui';

export const YouTubeEmbed = (props: { src: string }) => {
  return (
    <Box
      sx={{
        width: ['unset', 560],
        height: ['unset', 315],
      }}
    >
      <iframe
        style={{ width: '100%', height: '100%' }}
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        src={props.src}
      />
    </Box>
  );
};
