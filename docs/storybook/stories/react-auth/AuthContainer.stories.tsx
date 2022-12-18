import {
  AuthContainer,
  AuthContainerProps,
} from '@ttoss/react-auth/src/AuthContainer';
import { AuthSignIn, AuthSignInProps } from '@ttoss/react-auth/src/AuthSignIn';
import { Meta, Story } from '@storybook/react';

export default {
  title: 'React Auth/AuthContainer',
  component: AuthContainer,
} as Meta;

const Template: Story<AuthContainerProps & AuthSignInProps> = (args) => {
  return (
    <AuthContainer {...args}>
      <AuthSignIn {...args} />
    </AuthContainer>
  );
};

export const DefaultBackground = Template.bind({});

export const RandomBackgroundImage = Template.bind({});
RandomBackgroundImage.args = {
  backgroundImageUrl: 'https://static.cdn.siflor.com.br/images/siflor-bg.webp',
};
