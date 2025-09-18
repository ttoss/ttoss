import { Box, BoxProps } from '@ttoss/ui';

export const MainHeader = (props: BoxProps) => {
  return (
    <Box
      variant="layout.main.header"
      {...props}
      as="header"
      sx={{
        paddingX: '4',
        paddingY: '3',
        borderBottom: 'sm',
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

MainHeader.displayName = 'MainHeader';
