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

const SIDE_IMAGE_URL = 'https://cdn.triangulos.tech/assets/terezinha_500x500_da67d70b65.webp';

SideImageRight.args = {
  layout: {
    fullScreen: true,
    sideImage: (
      <Image 
        src={SIDE_IMAGE_URL}
        alt="Terezinha"
        onError={(e) => {
          console.error('Failed to load side image');
          e.currentTarget.style.display = 'none';
        }}
      />
    ),
  },
};

export const SideImageLeft = Template.bind({});

SideImageLeft.args = {
  layout: {
    fullScreen: true,
    sideImage: (
      <Image 
        src={SIDE_IMAGE_URL}
        alt="Terezinha"
        onError={(e) => {
          console.error('Failed to load side image');
          e.currentTarget.style.display = 'none';
        }}
      />
    ),
    sideImagePosition: 'left',
  },
};
