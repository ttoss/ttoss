import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge, Chip, Stack, Text } from '@ttoss/fsl-ui';

const meta: Meta<typeof Chip> = {
  title: 'Structure/Chip',
  component: Chip,
};

export default meta;

type Story = StoryObj<typeof Chip>;

export const Default: Story = {
  args: { children: 'Admin' },
};

export const Emphasis: Story = {
  render: () => {
    return (
      <Stack direction="horizontal" gap="sm" align="center">
        <Chip evaluation="muted">Muted</Chip>
        <Chip evaluation="primary">Primary</Chip>
      </Stack>
    );
  },
};

/**
 * The distinction the component exists for. Both chips are the same box — a
 * `Chip` beside a `Badge` must not disagree about its own roundness — and they
 * say different things: the Badge reports an outcome the system observed, the
 * Chip labels content that simply is what it is.
 */
export const AgainstBadge: Story = {
  render: () => {
    return (
      <Stack gap="md">
        <Stack direction="horizontal" gap="sm" align="center">
          <Text variant="label-sm" tone="muted">
            Chip — descriptive, no outcome
          </Text>
          <Chip>Admin</Chip>
          <Chip>Editor</Chip>
          <Chip>Beta</Chip>
        </Stack>
        <Stack direction="horizontal" gap="sm" align="center">
          <Text variant="label-sm" tone="muted">
            Badge — an outcome the system reports
          </Text>
          <Badge evaluation="positive">Passing</Badge>
          <Badge evaluation="caution">Degraded</Badge>
          <Badge evaluation="negative">Failing</Badge>
        </Stack>
      </Stack>
    );
  },
};

export const InAList: Story = {
  render: () => {
    return (
      <Stack gap="sm">
        {[
          { name: 'ada@northline.dev', role: 'Admin' },
          { name: 'grace@northline.dev', role: 'Editor' },
          { name: 'lin@northline.dev', role: 'Viewer' },
        ].map((member) => {
          return (
            <Stack
              key={member.name}
              direction="horizontal"
              gap="sm"
              align="center"
            >
              <Text>{member.name}</Text>
              <Chip>{member.role}</Chip>
            </Stack>
          );
        })}
      </Stack>
    );
  },
};
