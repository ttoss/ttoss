import type { Meta, StoryObj } from '@storybook/react-vite';
import { NumberField } from '@ttoss/fsl-ui';

const meta: Meta<typeof NumberField> = {
  title: 'Input/NumberField',
  component: NumberField,
};

export default meta;

type Story = StoryObj<typeof NumberField>;

export const Default: Story = {
  args: { label: 'Quantity', defaultValue: 1 },
};

export const Bounded: Story = {
  args: { label: 'Seats', defaultValue: 5, minValue: 1, maxValue: 10 },
};
