import { Auth, type AuthProps } from '@ttoss/react-auth';
import { Image } from '@ttoss/ui';
import { Meta, StoryFn } from '@storybook/react';

export default {
  title: 'React Auth/Auth',
  component: Auth,
} as Meta;

const Template: StoryFn<AuthProps> = (args) => {
  return <Auth {...args} />;
};

export const Example = Template.bind({});

export const SideImageRight = Template.bind({});

SideImageRight.args = {
  layout: {
    fullScreen: true,
    sideImage: (
      <Image src="https://cdn.triangulos.tech/assets/terezinha_500x500_da67d70b65.webp" />
    ),
  },
};

export const SideImageLeft = Template.bind({});

SideImageLeft.args = {
  layout: {
    fullScreen: true,
    sideImage: (
      <Image src="https://cdn.triangulos.tech/assets/terezinha_500x500_da67d70b65.webp" />
    ),
    sideImagePosition: 'left',
  },
};
