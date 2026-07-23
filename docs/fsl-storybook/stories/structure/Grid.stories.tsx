import type { Meta, StoryObj } from '@storybook/react-vite';
import { Grid, Surface, Text } from '@ttoss/fsl-ui';

const meta: Meta<typeof Grid> = {
  title: 'Structure/Grid',
  component: Grid,
};

export default meta;

type Story = StoryObj<typeof Grid>;

export const Default: Story = {
  render: () => {
    return (
      <Grid columns={3} gap="md">
        <Surface level="flat" padding="md">
          <Text>One</Text>
        </Surface>
        <Surface level="flat" padding="md">
          <Text>Two</Text>
        </Surface>
        <Surface level="flat" padding="md">
          <Text>Three</Text>
        </Surface>
      </Grid>
    );
  },
};

export const Responsive: Story = {
  render: () => {
    return (
      <Grid minColumnWidth="xs" gap="md">
        <Surface level="flat" padding="md">
          <Text>Auto-fit</Text>
        </Surface>
        <Surface level="flat" padding="md">
          <Text>columns from</Text>
        </Surface>
        <Surface level="flat" padding="md">
          <Text>a min width</Text>
        </Surface>
      </Grid>
    );
  },
};
