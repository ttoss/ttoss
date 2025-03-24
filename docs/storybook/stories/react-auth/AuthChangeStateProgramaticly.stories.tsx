import { Meta, StoryFn } from '@storybook/react';
import { Auth, type AuthProps, AuthProvider, useAuth } from '@ttoss/react-auth';
import * as React from 'react';

export default {
  title: 'React Auth/AuthChangeStateProgramaticly',
  component: Auth,
} as Meta;

const AuthWithSetScreen = (args: AuthProps) => {
  const { setScreen } = useAuth();

  React.useEffect(() => {
    setScreen({
      value: 'signUp',
      context: {},
    });
  }, [setScreen]);

  return <Auth {...args} />;
};

const Template: StoryFn<AuthProps> = (args) => {
  return (
    <AuthProvider>
      <AuthWithSetScreen {...args} />
    </AuthProvider>
  );
};

export const Example = Template.bind({});
