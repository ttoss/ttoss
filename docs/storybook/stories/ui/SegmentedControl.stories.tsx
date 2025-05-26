import type { Meta, StoryObj } from '@storybook/react';
import { SegmentedControl } from '@ttoss/ui';

const meta = {
  title: 'UI/SegmentedControl',
  component: SegmentedControl,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SegmentedControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    options: ['Option 1', 'Option 2', 'Option 3'],
    onChange: (value) => {
      return value;
    },
  },
};

export const WithInitialValue: Story = {
  args: {
    options: ['Option 1', 'Option 2', 'Option 3'],
    defaultValue: 'Option 2',
    onChange: (value) => {
      return value;
    },
  },
};

export const Disabled: Story = {
  args: {
    options: ['Option 1', 'Option 2', 'Option 3'],
    disabled: true,
  },
};

export const WithObjectOptions: Story = {
  args: {
    options: [
      { label: 'First Option', value: 'option1' },
      { label: 'Second Option', value: 'option2' },
      { label: 'Disabled Option', value: 'option3', disabled: true },
    ],
    onChange: (value) => {
      return value;
    },
  },
};
