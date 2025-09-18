import { Meta, StoryFn } from '@storybook/react-webpack5';
import { Box } from '@ttoss/ui';

import { LogoProvider } from '../../../../packages/react-auth/src/AuthCard';
import {
  AuthForgotPassword,
  type AuthForgotPasswordProps,
} from '../../../../packages/react-auth/src/AuthForgotPassword';

export default {
  title: 'React Auth/AuthForgotPassword',
  component: AuthForgotPassword,
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

const Template: StoryFn<AuthForgotPasswordProps> = (args) => {
  return <AuthForgotPassword {...args} />;
};

export const Example = Template.bind({});

export const WithLogo: StoryFn<AuthForgotPasswordProps> = (args) => {
  return (
    <LogoProvider logo={<Logo />}>
      <AuthForgotPassword {...args} />
    </LogoProvider>
  );
};
