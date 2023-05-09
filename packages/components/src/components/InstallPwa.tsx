import * as React from 'react';
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

export const InstallPwa = () => {
  const [supportsPwa, setSupportsPwa] = React.useState(false);
  const [promptInstall, setPromptInstall] = React.useState<any>(null);

  React.useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setSupportsPwa(true);
      setPromptInstall(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      return window.removeEventListener('transitionend', handler);
    };
  }, []);

  const onInstall = (e: any) => {
    e.preventDefault();
    if (!promptInstall) {
      return;
    }
    promptInstall.prompt();
  };

  if (!supportsPwa) {
    return null;
  }

  return <InstallPwaUi onInstall={onInstall} />;
};
