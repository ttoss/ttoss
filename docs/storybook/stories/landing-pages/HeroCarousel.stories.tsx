import { Meta, Story } from '@storybook/react-webpack5';
import { HeroCarousel, HeroCarouselProps } from '@ttoss/landing-pages';

export default {
  title: 'Landing Pages/HeroCarousel',
  component: HeroCarousel,
} as Meta;

const Template: Story<HeroCarouselProps> = (args) => {
  return <HeroCarousel {...args} />;
};

const IMAGES = [
  'https://tt-sandbox-general-purpose.s3.amazonaws.com/modules/brutality-1.png',
  'https://tt-sandbox-general-purpose.s3.amazonaws.com/modules/brutality-2.png',
  'https://tt-sandbox-general-purpose.s3.amazonaws.com/modules/brutality-3.png',
  'https://tt-sandbox-general-purpose.s3.amazonaws.com/modules/close-up-prison-bars-1.png',
];

export const Example = Template.bind({});

Example.args = {
  images: IMAGES.map((src) => {
    return { src, id: src, alt: `alt ${src}` };
  }),
};
