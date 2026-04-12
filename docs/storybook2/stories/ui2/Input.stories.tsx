import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input } from '@ttoss/ui2';

const meta: Meta<typeof Input> = {
  title: 'ui2/Input',
  component: Input,
  tags: ['autodocs'],
  args: {
    placeholder: 'Type here...',
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {};

export const Small: Story = {
  args: { size: 'sm', placeholder: 'Small input' },
};

export const Large: Story = {
  args: { size: 'lg', placeholder: 'Large input' },
};

export const Disabled: Story = {
  args: { disabled: true, value: 'Cannot edit' },
};

export const ReadOnly: Story = {
  args: { readOnly: true, value: 'Read only value' },
};

export const AllSizes: Story = {
  render: () => {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          width: 300,
        }}
      >
        <Input size="sm" placeholder="Small" />
        <Input size="md" placeholder="Medium" />
        <Input size="lg" placeholder="Large" />
      </div>
    );
  },
};
