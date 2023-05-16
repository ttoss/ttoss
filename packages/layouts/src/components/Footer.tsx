import { Flex, FlexProps } from '@ttoss/ui';

export const Footer = (props: FlexProps) => {
  return (
    <Flex
      as="footer"
      variant="layout.footer"
      {...props}
      sx={{
        ...props.sx,
      }}
    >
      {props.children}
    </Flex>
  );
};

Footer.displayName = 'Footer';
