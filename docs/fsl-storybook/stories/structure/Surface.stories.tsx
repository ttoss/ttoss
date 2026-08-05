import type { Meta, StoryObj } from '@storybook/react-vite';
import { Grid, Stack, Surface, Text } from '@ttoss/fsl-ui';

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

/**
 * The four levels at a fixed `evaluation`, in the same fill (F-048): depth is
 * now carried by the paired shadow recipe alone, not by a per-level colour —
 * put the mouse away and look for the shadow, not the tint, to tell the
 * levels apart. Check both Storybook themes (light/dark) to see the shadow
 * step through.
 */
export const Levels: Story = {
  tags: ['autodocs'],
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

/**
 * `evaluation` now drives the fill at every level (F-048), the same rule
 * `Menu`/`Popover`/`Dialog`/`Drawer` already use — before, only the hairline
 * boundary responded to `evaluation` at `raised`/`overlay`/`blocking`; the
 * stratum alone picked the fill. Compare a row against itself: only the
 * boundary — and now the fill too — should shift between `muted` and
 * `primary`, at a fixed level.
 */
export const Evaluations: Story = {
  tags: ['autodocs'],
  render: () => {
    return (
      <Stack gap="lg">
        <Grid minColumnWidth="xs" gap="lg">
          <Surface level="overlay" evaluation="muted" padding="md">
            <Text>overlay · muted</Text>
          </Surface>
          <Surface level="overlay" evaluation="primary" padding="md">
            <Text>overlay · primary</Text>
          </Surface>
        </Grid>
        <Grid minColumnWidth="xs" gap="lg">
          <Surface level="blocking" evaluation="muted" padding="md">
            <Text>blocking · muted</Text>
          </Surface>
          <Surface level="blocking" evaluation="primary" padding="md">
            <Text>blocking · primary</Text>
          </Surface>
        </Grid>
      </Stack>
    );
  },
};
