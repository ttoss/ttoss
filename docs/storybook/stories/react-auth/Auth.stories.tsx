import { Meta, StoryFn } from '@storybook/react';
import { Auth, type AuthProps } from '@ttoss/react-auth';
import { Image } from '@ttoss/ui';

export default {
  title: 'React Auth/Auth',
  component: Auth,
} as Meta;

const Template: StoryFn<AuthProps> = (args) => {
  return <Auth {...args} />;
};

export const Example = Template.bind({});

export const SideImageRight = Template.bind({});

const SIDE_IMAGE_URL =
  'https://cdn.triangulos.tech/assets/terezinha_500x500_da67d70b65.webp';

SideImageRight.args = {
  layout: {
    fullScreen: true,
    sideContent: (
      <Image
        src={SIDE_IMAGE_URL}
        alt="Terezinha"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    ),
    sideContentPosition: 'right',
  },
};

export const SideImageLeft = Template.bind({});

SideImageLeft.args = {
  layout: {
    fullScreen: true,
    sideContent: (
      <Image
        src={SIDE_IMAGE_URL}
        alt="Terezinha"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    ),
    sideContentPosition: 'left',
  },
};
