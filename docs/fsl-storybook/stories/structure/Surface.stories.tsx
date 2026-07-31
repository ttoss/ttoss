import type { Meta, StoryObj } from '@storybook/react-vite';
import { Grid, Surface, Text } from '@ttoss/fsl-ui';

const meta: Meta<typeof Surface> = {
  title: 'Structure/Surface',
  component: Surface,
};

export default meta;

type Story = StoryObj<typeof Surface>;

export const Default: Story = {
  render: () => {
    return (
      <Surface level="raised" padding="lg">
        <Text>A raised surface — the card primitive.</Text>
      </Surface>
    );
  },
};

export const Levels: Story = {
  render: () => {
    return (
      <Grid minColumnWidth="xs" gap="lg">
        <Surface level="flat" padding="md">
          <Text>flat</Text>
        </Surface>
        <Surface level="raised" padding="md">
          <Text>raised</Text>
        </Surface>
        <Surface level="overlay" padding="md">
          <Text>overlay</Text>
        </Surface>
        <Surface level="blocking" padding="md">
          <Text>blocking</Text>
        </Surface>
      </Grid>
    );
  },
};
