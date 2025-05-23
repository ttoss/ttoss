import { useNotifications } from '@ttoss/react-notifications';
import { Box, Button, Flex, Heading } from '@ttoss/ui';
import * as React from 'react';

import { ErrorBoundary } from './ErrorBoundary';

export type LogoContextProps = {
  logo?: React.ReactNode;
  children?: React.ReactNode;
};

const LogoContext = React.createContext<LogoContextProps>({});

export const LogoProvider = ({ children, ...values }: LogoContextProps) => {
  return <LogoContext.Provider value={values}>{children}</LogoContext.Provider>;
};

type AuthCardProps = {
  children: React.ReactNode;
  title: string;
  buttonLabel: string;
  extraButton?: React.ReactNode;
  isValidForm?: boolean;
};

export const AuthCard = ({
  children,
  title,
  buttonLabel,
  extraButton,
  isValidForm,
}: AuthCardProps) => {
  const { logo } = React.useContext(LogoContext);

  const { isLoading } = useNotifications();

  return (
    <Box
      sx={{
        maxWidth: '400px',
        width: 'full',
        border: 'md',
        borderColor: 'display.border.muted.default',
        paddingX: '8',
        paddingY: '9',
        backgroundColor: 'surface',
      }}
    >
      {logo && (
        <Flex
          sx={{
            width: 'full',
            maxHeight: '90px',
            justifyContent: 'center',
            marginBottom: '8',
          }}
        >
          {logo}
        </Flex>
      )}
      <Flex sx={{ flexDirection: 'column' }}>
        <Heading
          as="h2"
          variant="h2"
          sx={{
            marginBottom: '8',
          }}
        >
          {title}
        </Heading>
        <ErrorBoundary>{children}</ErrorBoundary>
        <Flex
          sx={{
            flexDirection: 'column',
            width: '100%',
            gap: '7',
            marginTop: '8',
          }}
        >
          <Button
            type="submit"
            aria-label="submit-button"
            variant="accent"
            disabled={isLoading || !isValidForm}
            sx={{ textAlign: 'center', display: 'initial' }}
            loading={isLoading}
          >
            {buttonLabel}
          </Button>
          {extraButton}
        </Flex>
      </Flex>
    </Box>
  );
};
