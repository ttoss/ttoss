import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box, Meter } from '@ttoss/fsl-ui';

const meta: Meta<typeof Meter> = {
  title: 'Feedback/Meter',
  component: Meter,
  tags: ['autodocs'],
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

/**
 * `Meter` fills its container the same as `ProgressBar` — the reference's own
 * `meter-default-width` (192px) is not adopted (F-052): defaulting a static
 * gauge to a fixed width would break every existing consumer that fills its
 * container today. A host that wants the reference's fixed measure composes
 * it with `Box`, the sanctioned width-constraining primitive (CONTRACT §7.1).
 */
export const FixedWidthByComposition: Story = {
  render: () => {
    return (
      <Box maxWidth="reading">
        <Meter
          aria-label="Battery"
          label="Battery"
          value={12}
          evaluation="negative"
        />
      </Box>
    );
  },
};
