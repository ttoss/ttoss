import { Box, BoxProps } from '@ttoss/ui';

export const MainFooter = (props: BoxProps) => {
  return (
    <Box
      variant="layout.main.footer"
      {...props}
      sx={{
        paddingX: '10',
        paddingY: '3',
        borderTop: 'sm',
        borderColor: 'display.border.muted.default',
        backgroundColor: 'navigation.background.primary.default',
        width: 'full',
        ...props.sx,
      }}
    >
      {props.children}
    </Box>
  );
};

MainFooter.displayName = 'MainFooter';
