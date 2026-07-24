import type { Meta, StoryObj } from '@storybook/react-vite';
import { Icon, ICON_INTENTS, Stack, Text } from '@ttoss/fsl-ui';

const meta: Meta<typeof Icon> = {
  title: 'Structure/Icon',
  component: Icon,
};

export default meta;

type Story = StoryObj<typeof Icon>;

export const Default: Story = {
  args: { intent: 'status.success', label: 'Success' },
};

export const AllIntents: Story = {
  render: () => {
    return (
      <Stack gap="sm">
        {ICON_INTENTS.map((intent) => {
          return (
            <Stack key={intent} direction="horizontal" gap="md" align="center">
              <Icon intent={intent} />
              <Text as="span" variant="label-sm" tone="muted">
                {intent}
              </Text>
            </Stack>
          );
        })}
      </Stack>
    );
  },
};

export const Sizes: Story = {
  render: () => {
    return (
      <Stack direction="horizontal" gap="md" align="center">
        <Icon intent="status.success" size="sm" />
        <Icon intent="status.success" size="md" />
        <Icon intent="status.success" size="lg" />
      </Stack>
    );
  },
};
