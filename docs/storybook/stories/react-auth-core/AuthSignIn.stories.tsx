import type { Meta, StoryFn } from '@storybook/react-webpack5';
import { Box } from '@ttoss/ui';

import { LogoProvider } from '../../../../packages/react-auth-core/src/AuthCard';
import type { AuthSignInProps } from '../../../../packages/react-auth-core/src/AuthSignIn';
import { AuthSignIn } from '../../../../packages/react-auth-core/src/AuthSignIn';

export default {
  title: 'React Auth Core/AuthSignIn',
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

export const WithSocialProviders: StoryFn<AuthSignInProps> = (args) => {
  return (
    <AuthSignIn
      {...args}
      socialProviders={['Google', 'Facebook']}
      onSocialSignIn={({ provider }) => {
        // eslint-disable-next-line no-console
        console.log(`sign in with ${provider}`);
      }}
    />
  );
};

export const WithLogo: StoryFn<AuthSignInProps> = (args) => {
  return (
    <LogoProvider logo={<Logo />}>
      <AuthSignIn {...args} />
    </LogoProvider>
  );
};
