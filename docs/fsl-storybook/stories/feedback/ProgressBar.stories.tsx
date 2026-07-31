import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProgressBar } from '@ttoss/fsl-ui';

const meta: Meta<typeof ProgressBar> = {
  title: 'Feedback/ProgressBar',
  component: ProgressBar,
};

export default meta;

type Story = StoryObj<typeof ProgressBar>;

export const Default: Story = {
  args: { label: 'Uploading', value: 40 },
};

export const Indeterminate: Story = {
  args: { label: 'Deploying', isIndeterminate: true },
};
