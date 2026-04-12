import type { Meta, StoryObj } from '@storybook/react-vite';
import { ValidationMessage } from '@ttoss/ui2';

const meta: Meta<typeof ValidationMessage> = {
  title: 'ui2/ValidationMessage',
  component: ValidationMessage,
  tags: ['autodocs'],
  args: {
    children: 'This field is required.',
  },
};

export default meta;
type Story = StoryObj<typeof ValidationMessage>;

export const Default: Story = {};
