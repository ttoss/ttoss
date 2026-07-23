import type { Meta, StoryObj } from '@storybook/react-vite';
import { Meter } from '@ttoss/fsl-ui';

const meta: Meta<typeof Meter> = {
  title: 'Feedback/Meter',
  component: Meter,
  parameters: {
    // React Aria's useMeter deliberately renders `role="meter progressbar"`
    // (documented browser-support fallback); axe-core mishandles the
    // space-separated fallback list. Same suppression as the fsl-ui a11y
    // fixture — a tooling false positive, not a violation.
    a11y: {
      config: {
        rules: [{ id: 'aria-allowed-attr', enabled: false }],
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Meter>;

export const Default: Story = {
  args: { label: 'Storage used', value: 62 },
};

export const Caution: Story = {
  args: {
    label: 'Seats used',
    value: 128,
    maxValue: 150,
    evaluation: 'caution',
    valueLabel: '128 of 150',
  },
};
