/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineMessages, useI18n } from '@ttoss/react-i18n';
import { Button, Flex, Text } from '@ttoss/ui';
import * as React from 'react';

export type InstallPwaUiProps = {
  onInstall: React.MouseEventHandler<HTMLButtonElement>;
};

const messages = defineMessages({
  prompt: {
    defaultMessage: 'Deseja instalar o nosso aplicativo?',
    description: 'PWA install banner: the question offering installation.',
  },
  install: {
    defaultMessage: 'Instalar',
    description: 'PWA install banner: button that starts the installation.',
  },
});

export const InstallPwaUi = ({ onInstall }: InstallPwaUiProps) => {
  const { intl } = useI18n();

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
        <Text>{intl.formatMessage(messages.prompt)}</Text>
        <Button onClick={onInstall}>
          {intl.formatMessage(messages.install)}
        </Button>
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
