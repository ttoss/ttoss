import type { Meta, StoryObj } from '@storybook/react-vite';
import { Label } from '@ttoss/ui2';

const meta: Meta<typeof Label> = {
  title: 'ui2/Label',
  component: Label,
  tags: ['autodocs'],
  args: {
    children: 'Email address',
  },
};

export default meta;
type Story = StoryObj<typeof Label>;

export const Default: Story = {};
