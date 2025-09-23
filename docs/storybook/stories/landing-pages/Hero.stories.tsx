import { Meta, Story } from '@storybook/react-webpack5';
import { Hero, HeroProps } from '@ttoss/landing-pages';

export default {
  title: 'Landing Pages/Hero',
  component: Hero,
} as Meta;

const Template: Story<HeroProps> = (args) => {
  return <Hero {...args} />;
};

const exampleObj = {
  headerText: 'h1: Header text',
  subHeaderText: 'h2: Subheader text',
  alignment: 'center',
  imageSrc:
    'https://tt-sandbox-general-purpose.s3.amazonaws.com/modules/close-up-prison-bars-1.png',
  imageAlt: 'Hero section',
  ctaLabel: 'Clique aqui',
};

export const ExampleCenter = Template.bind({});

ExampleCenter.args = {
  ...exampleObj,
  alignment: 'center',
} as HeroProps;

export const ExampleLeft = Template.bind({});

ExampleLeft.args = {
  ...exampleObj,
  imageSrc:
    'https://tt-sandbox-general-purpose.s3.amazonaws.com/modules/brutality-1.png',
  alignment: 'left',
} as HeroProps;
