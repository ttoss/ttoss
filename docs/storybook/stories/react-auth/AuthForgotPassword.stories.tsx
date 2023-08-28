import {
  AuthForgotPassword,
  type AuthForgotPasswordProps,
} from '@ttoss/react-auth/src/AuthForgotPassword';
import { Box } from '@ttoss/ui';
import { LogoProvider } from '@ttoss/react-auth/src/AuthCard';
import { Meta, Story } from '@storybook/react';

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

const Template: Story<AuthForgotPasswordProps> = (args) => {
  return <AuthForgotPassword {...args} />;
};

export const Example = Template.bind({});

export const WithLogo: Story<AuthForgotPasswordProps> = (args) => {
  return (
    <LogoProvider logo={<Logo />}>
      <AuthForgotPassword {...args} />
    </LogoProvider>
  );
};
