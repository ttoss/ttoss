import type { Meta, StoryObj } from '@storybook/react-vite';
import { Stack, StatusLight } from '@ttoss/fsl-ui';

const meta: Meta<typeof StatusLight> = {
  title: 'Feedback/StatusLight',
  component: StatusLight,
};

export default meta;

type Story = StoryObj<typeof StatusLight>;

export const Default: Story = {
  args: { children: 'New' },
};

/**
 * The four evaluations, side by side. F-053: the silhouette is a coloured
 * dot plus a label on the page's own background — no fill. Only the dot
 * carries the valence; the label's ink is the same page default in every
 * case.
 */
export const Valences: Story = {
  render: () => {
    return (
      <Stack direction="horizontal" gap="sm" align="center">
        <StatusLight evaluation="primary">Default</StatusLight>
        <StatusLight evaluation="positive">Passing</StatusLight>
        <StatusLight evaluation="caution">Degraded</StatusLight>
        <StatusLight evaluation="negative">Failing</StatusLight>
      </Stack>
    );
  },
};

export const TabularNumeric: Story = {
  render: () => {
    return (
      <Stack direction="horizontal" gap="sm" align="center">
        <StatusLight evaluation="positive" numeric="tabular">
          +12%
        </StatusLight>
        <StatusLight evaluation="negative" numeric="tabular">
          −9%
        </StatusLight>
      </Stack>
    );
  },
};
