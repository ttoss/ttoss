import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProgressBar } from '@ttoss/ui2';

const meta: Meta<typeof ProgressBar> = {
  title: 'ui2/ProgressBar',
  component: ProgressBar,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    evaluation: {
      description:
        'Authorial valence of the progress (`primary` neutral, `positive` success/completion, `caution` approaching limits, `negative` failing).',
      control: 'inline-radio',
      options: ['primary', 'positive', 'caution', 'negative'],
    },
    value: {
      description: 'Current value (0–100 by default).',
      control: { type: 'range', min: 0, max: 100, step: 1 },
    },
    isIndeterminate: {
      description:
        'Unknown duration — renders an animated indeterminate track.',
      control: 'boolean',
    },
  },
  args: {
    label: 'Uploading files',
    evaluation: 'primary',
    value: 42,
    isIndeterminate: false,
  },
};

export default meta;
type Story = StoryObj<typeof ProgressBar>;

/** Default — 42% of a neutral upload. */
export const Default: Story = {};

/** Positive — operation succeeding (e.g. sync complete). */
export const Positive: Story = {
  args: { evaluation: 'positive', value: 100, label: 'Sync complete' },
};

/** Caution — nearing a limit. */
export const Caution: Story = {
  args: { evaluation: 'caution', value: 85, label: 'Storage used' },
};

/** Negative — operation failing. */
export const Negative: Story = {
  args: { evaluation: 'negative', value: 30, label: 'Connection degraded' },
};

/** Indeterminate — unknown duration (animated stripe). */
export const Indeterminate: Story = {
  args: { isIndeterminate: true, label: 'Loading…' },
};

/** AllEvaluations — visual comparison of the 4 legal Feedback evaluations. */
export const AllEvaluations: Story = {
  render: () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <ProgressBar label="primary" evaluation="primary" value={42} />
        <ProgressBar label="positive" evaluation="positive" value={100} />
        <ProgressBar label="caution" evaluation="caution" value={85} />
        <ProgressBar label="negative" evaluation="negative" value={30} />
      </div>
    );
  },
};
