import { Flex, Image, Text } from '@ttoss/ui';

export const FormSequenceFlowMessage = () => {
  return (
    <Flex
      sx={{
        flexDirection: 'column',
        paddingY: 'xl',
        paddingX: '2xl',
        gap: 'xl',
      }}
    >
      <Image
        src="https://s.glbimg.com/jo/g1/f/original/2011/05/17/qrcode.jpg"
        sx={{
          width: '184px',
          height: '184px',
          objectFit: 'cover',
          alignSelf: 'center',
        }}
      />

      <Text sx={{ textAlign: 'center' }}>
        Estamos aqui para ajudá-lo com o seu projeto solar. Vamos iniciar a sua
        cotação.
      </Text>
    </Flex>
  );
};
