import { Box, BoxProps } from '@ttoss/ui';

export interface MainProps extends BoxProps {
  Header?: React.ReactNode;
}

export const Main = (props: MainProps) => {
  const { Header, children, sx, ...rest } = props;
  return (
    <Box
      variant="layout.main"
      {...rest}
      as="main"
      sx={{
        overflowY: 'auto',
        width: 'full',
        height: 'full',
        ...sx,
      }}
    >
      {Header && <>{Header}</>}
      <Box sx={{ paddingX: '10', paddingY: '6' }}>{children}</Box>
    </Box>
  );
};

Main.displayName = 'Main';
