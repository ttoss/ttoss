import type { Meta, StoryObj } from '@storybook/react-vite';
import { Stack, Text } from '@ttoss/fsl-ui';

const meta: Meta<typeof Text> = {
  title: 'Structure/Text',
  component: Text,
};

export default meta;

type Story = StoryObj<typeof Text>;

export const Default: Story = {
  args: { children: 'Body copy at the default size.' },
};

export const Variants: Story = {
  render: () => {
    return (
      <Stack gap="sm">
        <Text variant="display-sm" numeric="tabular">
          1,284
        </Text>
        <Text variant="body-lg">Body lg</Text>
        <Text variant="body-md">Body md</Text>
        <Text variant="body-sm">Body sm</Text>
        <Text variant="label-lg">Label lg</Text>
        <Text variant="label-md">Label md</Text>
        <Text variant="label-sm">Label sm</Text>
      </Stack>
    );
  },
};

export const Tones: Story = {
  render: () => {
    return (
      <Stack gap="sm">
        <Text tone="default">Default tone carries primary content.</Text>
        <Text tone="muted">Muted tone carries supporting copy.</Text>
      </Stack>
    );
  },
};
