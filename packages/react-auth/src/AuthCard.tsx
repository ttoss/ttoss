import * as React from 'react';
import { Box, Button, Flex, Heading } from '@ttoss/ui';
import { useNotifications } from '@ttoss/react-notifications';

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
        width: '100%',
        border: 'default',
        borderColor: 'primary',
        paddingX: '2xl',
        paddingY: '3xl',
        backgroundColor: 'surface',
      }}
    >
      {logo && (
        <Flex
          sx={{
            width: '100%',
            maxHeight: '90px',
            justifyContent: 'center',
            marginBottom: '2xl',
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
            marginBottom: '2xl',
          }}
        >
          {title}
        </Heading>

        {children}

        <Flex
          sx={{
            flexDirection: 'column',
            width: '100%',
            gap: 'xl',
            marginTop: '2xl',
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
