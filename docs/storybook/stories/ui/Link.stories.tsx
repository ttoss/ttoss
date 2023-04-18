import { Link } from '@ttoss/ui/src';
import { Meta, StoryObj } from '@storybook/react';

type Story = StoryObj<typeof Link>;

const randomSite = () => {
  return `https://www.random-fake-site-${Math.random()}.com`;
};

export const Default: Story = {
  args: {
    children: 'Link Text',
    target: '_blank',
    href: randomSite(),
  },
};

export const DefaultQuiet: Story = {
  args: {
    ...Default.args,
    quiet: true,
  },
};

export const Visited: Story = {
  args: {
    ...Default.args,
    href: 'https://www.google.com.br',
  },
};

export const VisitedQuiet: Story = {
  args: {
    ...Default.args,
    href: 'https://www.google.com.br',
    quiet: true,
  },
};

const meta: Meta<typeof Link> = {
  title: 'UI/Link',
  component: Link,
};

export default meta;
