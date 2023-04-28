import * as React from 'react';
import { Box, Button, Flex, Link, Text } from '@ttoss/ui';
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
};

export const AuthCard = ({
  children,
  title,
  buttonLabel,
  links = [],
}: AuthCardProps) => {
  const { logo } = React.useContext(LogoContext);

  const { isLoading } = useNotifications();

  return (
    <Box sx={{ maxWidth: '564px' }}>
      <Flex sx={{ flexDirection: 'column', gap: 'md' }}>
        {logo && (
          <Flex sx={{ width: '100%', justifyContent: 'center' }}>{logo}</Flex>
        )}
        <Text sx={{ alignSelf: 'center', marginY: 'md', fontSize: 'xl' }}>
          {title}
        </Text>
        {children}
        <Flex sx={{ justifyContent: 'space-between', marginTop: 'md' }}>
          <Button
            type="submit"
            aria-label="submit-login"
            variant="cta"
            disabled={isLoading}
            sx={{ width: '100%' }}
          >
            {buttonLabel}
          </Button>
        </Flex>

        <Flex
          sx={{
            justifyContent: 'space-between',
            flexDirection: 'column',
            gap: 'sm',
            marginTop: 'md',
            color: 'text',
          }}
        >
          {links.map((link) => {
            return (
              link && (
                <Link key={link.label} onClick={link.onClick}>
                  {link.label}
                </Link>
              )
            );
          })}
        </Flex>
      </Flex>
    </Box>
  );
};
