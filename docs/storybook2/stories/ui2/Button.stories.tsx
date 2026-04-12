import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '@ttoss/ui2';

const meta: Meta<typeof Button> = {
  title: 'ui2/Button',
  component: Button,
  tags: ['autodocs'],
  args: {
    children: 'Click me',
  },
  argTypes: {
    evaluation: {
      control: 'select',
      options: ['primary', 'secondary', 'muted', 'negative'],
    },
    consequence: {
      control: 'select',
      options: [undefined, 'destructive', 'neutral'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    disabled: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: { evaluation: 'primary' },
};

export const Secondary: Story = {
  args: { evaluation: 'secondary' },
};

export const Muted: Story = {
  args: { evaluation: 'muted' },
};

export const Destructive: Story = {
  args: { consequence: 'destructive' },
};

export const Small: Story = {
  args: { size: 'sm', children: 'Small' },
};

export const Large: Story = {
  args: { size: 'lg', children: 'Large' },
};

export const Disabled: Story = {
  args: { evaluation: 'primary', disabled: true },
};

export const AllEvaluations: Story = {
  render: () => {
    return (
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Button evaluation="primary">Primary</Button>
        <Button evaluation="secondary">Secondary</Button>
        <Button evaluation="muted">Muted</Button>
        <Button consequence="destructive">Destructive</Button>
      </div>
    );
  },
};

export const AllSizes: Story = {
  render: () => {
    return (
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
      </div>
    );
  },
};
