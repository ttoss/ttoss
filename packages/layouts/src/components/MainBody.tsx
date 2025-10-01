import { Box, BoxProps } from '@ttoss/ui';

export const MainBody = (props: BoxProps) => {
  return (
    <Box
      variant="layout.main.body"
      {...props}
      as="main"
      sx={{
        paddingX: '10',
        paddingY: '6',
        overflowY: 'auto',
        width: 'full',
        height: 'full',
        ...props.sx,
      }}
    >
      {props.children}
    </Box>
  );
};

MainBody.displayName = 'MainBody';
