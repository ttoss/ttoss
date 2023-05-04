import * as React from 'react';
import { Box, Button, Flex, Text } from '@ttoss/ui';
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
    <Box variant="reactAuth.card">
      {logo && <Flex variant="reactAuth.logo">{logo}</Flex>}
      <Flex variant="reactAuth.form.container">
        <Text
          sx={{
            marginBottom: '2xl',
            fontSize: '3xl',
          }}
          variant="reactAuth.form.title"
        >
          {title}
        </Text>

        {children}

        <Flex variant="reactAuth.form.buttonsContainer">
          <Button
            type="submit"
            aria-label="submit-login"
            variant="accent"
            disabled={isLoading || !isValidForm}
            sx={{ textAlign: 'center', display: 'initial' }}
          >
            {buttonLabel}
          </Button>

          {extraButton}
        </Flex>
      </Flex>
    </Box>
  );
};
