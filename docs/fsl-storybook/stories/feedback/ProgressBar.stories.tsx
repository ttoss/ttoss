import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProgressBar } from '@ttoss/fsl-ui';

const meta: Meta<typeof ProgressBar> = {
  title: 'Feedback/ProgressBar',
  component: ProgressBar,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof ProgressBar>;

export const Default: Story = {
  args: { label: 'Uploading', value: 40 },
};

export const Indeterminate: Story = {
  args: { label: 'Deploying', isIndeterminate: true },
};

/**
 * `ProgressBar` fills its container by default (F-052) — fluid, no ceiling.
 * A host that wants the reference's 768px cap sets `--fsl-track-max-width`;
 * nothing else changes, and every existing consumer keeps today's fluid
 * behaviour unless it opts in. This story's wrapper is wider than the cap so
 * the rail visibly stops short of the container's edge.
 */
export const CappedWidth: Story = {
  render: () => {
    return (
      <div
        style={{ width: '100%', ['--fsl-track-max-width' as string]: '768px' }}
      >
        <ProgressBar label="Uploading" value={40} />
      </div>
    );
  },
};
