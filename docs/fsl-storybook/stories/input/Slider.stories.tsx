import type { Meta, StoryObj } from '@storybook/react-vite';
import { Slider } from '@ttoss/fsl-ui';

const meta: Meta<typeof Slider> = {
  title: 'Input/Slider',
  component: Slider,
};

export default meta;

type Story = StoryObj<typeof Slider>;

export const Default: Story = {
  args: { label: 'Volume', defaultValue: 50 },
};

export const Bounded: Story = {
  args: { label: 'Opacity', defaultValue: 80, minValue: 0, maxValue: 100 },
};
