import { Hero } from '@ttoss/landing-pages';
import { Meta, Story } from '@storybook/react';

export default {
  title: 'Landing Pages/Hero',
  component: Hero,
} as Meta;

const Template: Story = () => {
  return <Hero />;
};

export const Example = Template.bind({});
