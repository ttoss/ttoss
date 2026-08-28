import type { Meta, StoryObj } from '@storybook/react-vite';
import { Slider } from '@ttoss/fsl-ui';

const meta: Meta<typeof Slider> = {
  title: 'Input/Slider',
  component: Slider,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Slider>;

export const Default: Story = {
  args: { label: 'Volume', defaultValue: 50 },
};

export const Bounded: Story = {
  args: { label: 'Opacity', defaultValue: 80, minValue: 0, maxValue: 100 },
};

/**
 * `Slider`'s track shares the same `--fsl-track-max-width` knob as
 * `ProgressBar`/`Meter` (F-052) — one host rule caps all three rails.
 */
export const CappedWidth: Story = {
  render: () => {
    return (
      <div
        style={{ width: '100%', ['--fsl-track-max-width' as string]: '768px' }}
      >
        <Slider label="Volume" defaultValue={50} />
      </div>
    );
  },
};
