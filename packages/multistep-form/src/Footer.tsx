import { Flex, Text } from '@ttoss/ui';

export const Footer = ({ footer }: { footer: string }) => {
  return (
    <Flex sx={{ display: 'flex', justifyContent: 'center' }}>
      <Text
        sx={{
          textAlign: 'center',
          marginTop: '4xl',
          marginBottom: 'lg',
          marginX: '2xl',
        }}
      >
        {footer}
      </Text>
    </Flex>
  );
};
