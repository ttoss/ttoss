import { Flex, Text } from '@ttoss/ui';

export const MultistepFooter = ({ footer }: { footer: string }) => {
  return (
    <Flex sx={{ display: 'flex', justifyContent: 'center' }}>
      <Text
        sx={{
          textAlign: 'center',
          marginTop: '8',
          marginBottom: '4',
          marginX: '6',
        }}
      >
        {footer}
      </Text>
    </Flex>
  );
};
