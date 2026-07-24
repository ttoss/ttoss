import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge, Stack, Text } from '@ttoss/fsl-ui';

const meta: Meta<typeof Stack> = {
  title: 'Structure/Stack',
  component: Stack,
};

export default meta;

type Story = StoryObj<typeof Stack>;

export const Vertical: Story = {
  render: () => {
    return (
      <Stack gap="sm">
        <Text>First line</Text>
        <Text>Second line</Text>
        <Text>Third line</Text>
      </Stack>
    );
  },
};

export const Horizontal: Story = {
  render: () => {
    return (
      <Stack direction="horizontal" gap="md" align="center" justify="between">
        <Text>Deploys this week</Text>
        <Badge evaluation="positive">87</Badge>
      </Stack>
    );
  },
};
