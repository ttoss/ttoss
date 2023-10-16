import {
  AuthSignIn,
  AuthSignInProps,
} from '../../../../packages/react-auth/src/AuthSignIn';
import { Box } from '@ttoss/ui';
import { LogoProvider } from '../../../../packages/react-auth/src/AuthCard';
import { Meta, Story } from '@storybook/react';

export default {
  title: 'React Auth/AuthSignIn',
  component: AuthSignIn,
} as Meta;

const Logo = () => {
  return (
    <Box
      sx={{
        backgroundColor: 'muted',
        minWidth: '100%',
        height: '90px',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    />
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
