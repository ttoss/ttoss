import { Flex, Text } from '@ttoss/ui';

export const FormSequenceFooter = () => {
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
        TT modules v1.0
      </Text>
    </Flex>
  );
};
