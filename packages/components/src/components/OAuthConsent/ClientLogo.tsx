import { Flex, Text } from '@ttoss/ui';
import * as React from 'react';

type ClientLogoProps = {
  src: string;
  clientName: string;
};

export const ClientLogo = ({ src, clientName }: ClientLogoProps) => {
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
      alt={`${clientName} logo`}
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
