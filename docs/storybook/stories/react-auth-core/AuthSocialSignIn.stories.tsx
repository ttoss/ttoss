import type { Meta, StoryFn } from '@storybook/react-webpack5';

import type { AuthSocialSignInProps } from '../../../../packages/react-auth-core/src/AuthSocialSignIn';
import { AuthSocialSignIn } from '../../../../packages/react-auth-core/src/AuthSocialSignIn';

export default {
  title: 'React Auth Core/AuthSocialSignIn',
  component: AuthSocialSignIn,
  tags: ['autodocs'],
  args: {
    providers: ['Google', 'Facebook'],
    onSocialSignIn: ({ provider }: { provider: string }) => {
      // eslint-disable-next-line no-console
      console.log(`sign in with ${provider}`);
    },
  },
} as Meta;

export const Example: StoryFn<AuthSocialSignInProps> = (args) => {
  return <AuthSocialSignIn {...args} />;
};

export const GoogleOnly: StoryFn<AuthSocialSignInProps> = (args) => {
  return <AuthSocialSignIn {...args} providers={['Google']} />;
};

export const FacebookOnly: StoryFn<AuthSocialSignInProps> = (args) => {
  return <AuthSocialSignIn {...args} providers={['Facebook']} />;
};
