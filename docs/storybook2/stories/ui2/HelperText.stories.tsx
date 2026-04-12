import type { Meta, StoryObj } from '@storybook/react-vite';
import { HelperText } from '@ttoss/ui2';

const meta: Meta<typeof HelperText> = {
  title: 'ui2/HelperText',
  component: HelperText,
  tags: ['autodocs'],
  args: {
    children: 'This is a helpful hint.',
  },
};

export default meta;
type Story = StoryObj<typeof HelperText>;

export const Default: Story = {};
