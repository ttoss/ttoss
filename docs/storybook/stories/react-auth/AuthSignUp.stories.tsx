import { AuthSignUp, AuthSignUpProps } from '@ttoss/react-auth/src/AuthSignUp';
import { Meta, Story } from '@storybook/react';

export default {
  title: 'React Auth/AuthSignUp',
  component: AuthSignUp,
} as Meta;

const Template: Story<AuthSignUpProps> = (args) => {
  return <AuthSignUp {...args} />;
};

export const Example = Template.bind({});
