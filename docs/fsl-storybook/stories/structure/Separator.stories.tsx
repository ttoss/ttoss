import type { Meta, StoryObj } from '@storybook/react-vite';
import { Separator, Stack, Text } from '@ttoss/fsl-ui';

const meta: Meta<typeof Separator> = {
  title: 'Structure/Separator',
  component: Separator,
};

export default meta;

type Story = StoryObj<typeof Separator>;

export const Default: Story = {
  render: () => {
    return (
      <Stack gap="md">
        <Text>Section one.</Text>
        <Separator />
        <Text>Section two.</Text>
      </Stack>
    );
  },
};
