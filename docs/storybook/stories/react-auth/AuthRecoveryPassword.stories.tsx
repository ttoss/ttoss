import {
  AuthRecoveryPassword,
  type AuthRecoveryPasswordProps,
} from '@ttoss/react-auth/src/AuthRecoveryPassword';
import { Box } from '@ttoss/ui';
import { LogoProvider } from '@ttoss/react-auth/src/AuthCard';
import { Meta, Story } from '@storybook/react';

export default {
  title: 'React Auth/AuthRecoveryPassword',
  component: AuthRecoveryPassword,
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

const Template: Story<AuthRecoveryPasswordProps> = (args) => {
  return <AuthRecoveryPassword {...args} />;
};

export const Example = Template.bind({});

export const WithLogo: Story<AuthRecoveryPasswordProps> = (args) => {
  return (
    <LogoProvider logo={<Logo />}>
      <AuthRecoveryPassword {...args} />
    </LogoProvider>
  );
};
