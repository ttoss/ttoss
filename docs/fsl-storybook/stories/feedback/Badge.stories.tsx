import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge, Stack } from '@ttoss/fsl-ui';

const meta: Meta<typeof Badge> = {
  title: 'Feedback/Badge',
  component: Badge,
};

export default meta;

type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: { children: 'New' },
};

export const Valences: Story = {
  render: () => {
    return (
      <Stack direction="horizontal" gap="sm" align="center">
        <Badge evaluation="primary">Default</Badge>
        <Badge evaluation="positive">Passing</Badge>
        <Badge evaluation="caution">Degraded</Badge>
        <Badge evaluation="negative">Failing</Badge>
      </Stack>
    );
  },
};

export const TabularNumeric: Story = {
  render: () => {
    return (
      <Stack direction="horizontal" gap="sm" align="center">
        <Badge evaluation="positive" numeric="tabular">
          +12%
        </Badge>
        <Badge evaluation="negative" numeric="tabular">
          −9%
        </Badge>
      </Stack>
    );
  },
};
