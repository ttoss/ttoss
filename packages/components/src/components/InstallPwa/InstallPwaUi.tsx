import { Button, Flex, Text } from '@ttoss/ui';

export type InstallPwaUiProps = {
  onInstall: React.MouseEventHandler<HTMLButtonElement>;
};

export const InstallPwaUi = ({ onInstall }: InstallPwaUiProps) => {
  return (
    <Flex
      sx={{
        position: 'absolute',
        bottom: 4,
        width: '100%',
        justifyContent: 'center',
      }}
    >
      <Flex
        sx={{
          backgroundColor: 'background',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 3,
          width: 'auto',
          border: '1px solid',
          borderColor: 'muted',
          borderRadius: 1,
          padding: 4,
        }}
      >
        <Text>Deseja instalar o nosso aplicativo?</Text>
        <Button onClick={onInstall}>Instalar</Button>
      </Flex>
    </Flex>
  );
};
