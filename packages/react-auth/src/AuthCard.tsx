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

type LinkProps = {
  label: string;
  onClick: () => void;
};

type AuthCardProps = {
  children: React.ReactNode;
  title: string;
  buttonLabel: string;
  links?: LinkProps[];
  extraButton?: React.ReactNode;
};

export const AuthCard = ({
  children,
  title,
  buttonLabel,
  extraButton,
}: AuthCardProps) => {
  const { logo } = React.useContext(LogoContext);

  const { isLoading } = useNotifications();

  return (
    <Box
      variant="reactAuth.card"
      sx={{
        maxWidth: '390px',
        border: '1px solid #292C2A',
        paddingX: '34px',
        paddingY: '55px',
      }}
    >
      {logo && (
        <Flex
          variant="reactAuth.logo"
          sx={{
            width: '100%',
            maxHeight: '90px',
            justifyContent: 'center',
          }}
        >
          {logo}
        </Flex>
      )}
      <Flex
        variant="reactAuth.form.container"
        sx={{ flexDirection: 'column', gap: 'md' }}
      >
        <Text
          sx={{
            marginY: '2xl',
            fontSize: '3xl',
          }}
          variant="reactAuth.form.title"
        >
          {title}
        </Text>

        {children}

        <Flex
          variant="reactAuth.form.buttonsContainer"
          sx={{ flexDirection: 'column', width: '100%', gap: 'xl' }}
        >
          <Button
            type="submit"
            aria-label="submit-login"
            variant="accent"
            disabled={isLoading}
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
