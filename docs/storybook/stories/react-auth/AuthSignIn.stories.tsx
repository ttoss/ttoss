import { AuthSignIn, AuthSignInProps } from '@ttoss/react-auth/src/AuthSignIn';
import { Flex } from '@ttoss/ui';
import { LogoProvider } from '@ttoss/react-auth/src/AuthCard';
import { Meta, Story } from '@storybook/react';

export default {
  title: 'React Auth/AuthSignIn',
  component: AuthSignIn,
} as Meta;

const Logo = () => {
  return (
    <Flex
      sx={{
        backgroundColor: 'primary',
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <p style={{ color: 'white' }}>LOGO</p>
    </Flex>
  );
};

export const Example: Story<AuthSignInProps> = (args) => {
  return <AuthSignIn {...args} />;
};

export const WithLogo: Story<AuthSignInProps> = (args) => {
  return (
    <LogoProvider logo={<Logo />}>
      <AuthSignIn {...args} />
    </LogoProvider>
  );
};
