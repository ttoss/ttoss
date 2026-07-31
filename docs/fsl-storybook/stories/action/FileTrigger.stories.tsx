import type { Meta, StoryObj } from '@storybook/react-vite';
import { FileTrigger } from '@ttoss/fsl-ui';

const meta: Meta<typeof FileTrigger> = {
  title: 'Action/FileTrigger',
  component: FileTrigger,
};

export default meta;

type Story = StoryObj<typeof FileTrigger>;

export const Default: Story = {
  args: { children: 'Upload file' },
};

export const Secondary: Story = {
  args: { children: 'Attach document', evaluation: 'secondary' },
};
