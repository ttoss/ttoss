import { Meta, StoryFn } from '@storybook/react';

import {
  AuthSignUp,
  AuthSignUpProps,
} from '../../../../packages/react-auth/src/AuthSignUp';

export default {
  title: 'React Auth/AuthSignUp',
  component: AuthSignUp,
} as Meta;

const Template: StoryFn<AuthSignUpProps> = (args) => {
  return <AuthSignUp {...args} />;
};

export const Example = Template.bind({});

export const WithRequiredTerms = Template.bind({});
WithRequiredTerms.args = {
  signUpTerms: {
    isRequired: true,
    termsAndConditions: [
      {
        label: 'Terms and Conditions',
        url: 'https://example.com/terms',
      },
      {
        label: 'Privacy Policy',
        url: 'https://example.com/privacy',
      },
    ],
  },
};

export const WithOptionalTerms = Template.bind({});
WithOptionalTerms.args = {
  signUpTerms: {
    isRequired: false,
    termsAndConditions: [
      {
        label: 'Terms and Conditions',
        url: 'https://example.com/terms',
      },
      {
        label: 'Privacy Policy',
        url: 'https://example.com/privacy',
      },
    ],
  },
};
