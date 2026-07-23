import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box, Text } from '@ttoss/fsl-ui';

const meta: Meta<typeof Box> = {
  title: 'Structure/Box',
  component: Box,
};

export default meta;

type Story = StoryObj<typeof Box>;

export const Default: Story = {
  render: () => {
    return (
      <Box padding="md" background="muted" radius="surface" border="muted">
        <Text>A padded, bordered box on the muted surface.</Text>
      </Box>
    );
  },
};

export const ReadingMeasure: Story = {
  render: () => {
    return (
      <Box maxWidth="reading">
        <Text>
          A box capped at the readability measure keeps long-form text at a
          comfortable line length regardless of viewport width.
        </Text>
      </Box>
    );
  },
};
