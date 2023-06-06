import { Box, BoxProps } from '@ttoss/ui';

export type BaseLayoutProps = BoxProps;

export const BaseLayout = (props: BaseLayoutProps) => {
  return <Box {...props}>{props.children}</Box>;
};
