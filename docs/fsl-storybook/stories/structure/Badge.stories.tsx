import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge, Stack, StatusLight, Text } from '@ttoss/fsl-ui';

const meta: Meta<typeof Badge> = {
  title: 'Structure/Badge',
  component: Badge,
};

export default meta;

type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: { children: 'Admin' },
};

export const Emphasis: Story = {
  render: () => {
    return (
      <Stack direction="horizontal" gap="sm" align="center">
        <Badge evaluation="muted">Muted</Badge>
        <Badge evaluation="primary">Primary</Badge>
      </Stack>
    );
  },
};

/**
 * The distinction the component exists for. Both chips are the same box — a
 * `Badge` beside a `StatusLight` must not disagree about its own roundness — and they
 * say different things: the Badge reports an outcome the system observed, the
 * Badge labels content that simply is what it is.
 */
export const AgainstStatusLight: Story = {
  render: () => {
    return (
      <Stack gap="md">
        <Stack direction="horizontal" gap="sm" align="center">
          <Text variant="label-sm" tone="muted">
            Badge — descriptive, no outcome
          </Text>
          <Badge>Admin</Badge>
          <Badge>Editor</Badge>
          <Badge>Beta</Badge>
        </Stack>
        <Stack direction="horizontal" gap="sm" align="center">
          <Text variant="label-sm" tone="muted">
            StatusLight — an outcome the system reports
          </Text>
          <StatusLight evaluation="positive">Passing</StatusLight>
          <StatusLight evaluation="caution">Degraded</StatusLight>
          <StatusLight evaluation="negative">Failing</StatusLight>
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
              <Badge>{member.role}</Badge>
            </Stack>
          );
        })}
      </Stack>
    );
  },
};
