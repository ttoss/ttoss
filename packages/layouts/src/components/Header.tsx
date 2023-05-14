import { Flex, FlexProps } from '@ttoss/ui';

export const Header = (props: FlexProps) => {
  return (
    <Flex
      as="header"
      variant="layout.header"
      {...props}
      sx={{
        ...props.sx,
      }}
    >
      {props.children}
    </Flex>
  );
};
