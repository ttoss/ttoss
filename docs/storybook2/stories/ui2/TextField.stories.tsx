import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextField } from '@ttoss/ui2';

const meta: Meta<typeof TextField> = {
  title: 'ui2/TextField',
  component: TextField,
  tags: ['autodocs'],
  args: {
    label: 'Email address',
    placeholder: 'you@example.com',
    helperText: 'We will never share your email.',
  },
  argTypes: {
    invalid: { control: 'boolean' },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    errorText: { control: 'text' },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof TextField>;

export const Default: Story = {};

export const WithError: Story = {
  args: {
    invalid: true,
    errorText: 'This field is required.',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const Required: Story = {
  args: {
    required: true,
  },
};
