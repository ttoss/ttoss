import {
  AuthSignIn,
  AuthSignInProps,
} from '../../../../packages/react-auth/src/AuthSignIn';
import { Box } from '@ttoss/ui';
import { LogoProvider } from '../../../../packages/react-auth/src/AuthCard';
import { Meta, StoryFn } from '@storybook/react';

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

export const Example: StoryFn<AuthSignInProps> = (args) => {
  return <AuthSignIn {...args} />;
};

export const WithLogo: StoryFn<AuthSignInProps> = (args) => {
  return (
    <LogoProvider logo={<Logo />}>
      <AuthSignIn {...args} />
    </LogoProvider>
  );
};
