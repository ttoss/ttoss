import { useNotifications } from '@ttoss/react-notifications';
import { Box, Button, Flex, Heading } from '@ttoss/ui';
import * as React from 'react';

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
        width: 'full',
        border: 'md',
        borderColor: 'display.border.muted.default',
        paddingX: '6',
        paddingY: '7',
        backgroundColor: 'surface',
      }}
    >
      {logo && (
        <Flex
          sx={{
            width: 'full',
            maxHeight: '90px',
            justifyContent: 'center',
            marginBottom: '6',
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
            marginBottom: '6',
          }}
        >
          {title}
        </Heading>

        {children}

        <Flex
          sx={{
            flexDirection: 'column',
            width: '100%',
            gap: '5',
            marginTop: '6',
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
