import { defineMessages, useI18n } from '@ttoss/react-i18n';
import { Flex, Text } from '@ttoss/ui';
import * as React from 'react';

type ClientLogoProps = {
  src: string;
  clientName: string;
};

const messages = defineMessages({
  logoAlt: {
    defaultMessage: '{name} logo',
    description: 'OAuth consent: alt text for the requesting application logo.',
  },
});

export const ClientLogo = ({ src, clientName }: ClientLogoProps) => {
  const { intl } = useI18n();
  const [errored, setErrored] = React.useState(false);

  if (errored) {
    return (
      <Flex
        aria-hidden="true"
        sx={{
          width: 48,
          height: 48,
          borderRadius: 'lg',
          backgroundColor: 'display.background.muted.default',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          sx={{
            fontSize: 'xl',
            fontWeight: 'bold',
            color: 'display.text.muted.default',
          }}
        >
          {clientName.charAt(0).toUpperCase()}
        </Text>
      </Flex>
    );
  }

  return (
    <img
      src={src}
      alt={intl.formatMessage(messages.logoAlt, { name: clientName })}
      onError={() => {
        return setErrored(true);
      }}
      style={{
        width: 48,
        height: 48,
        borderRadius: 8,
        objectFit: 'contain',
        display: 'block',
      }}
    />
  );
};
