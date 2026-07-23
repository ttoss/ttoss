import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppShell, Heading, Stack, Text } from '@ttoss/fsl-ui';

const meta: Meta<typeof AppShell> = {
  title: 'Structure/AppShell',
  component: AppShell,
  parameters: {
    // The shell fills the viewport (100dvh) — full-bleed canvas.
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof AppShell>;

export const Default: Story = {
  render: () => {
    return (
      <AppShell
        header={<Text variant="label-lg">Acme Workspace</Text>}
        sidebar={
          <Stack gap="sm">
            <Text variant="label-md">Overview</Text>
            <Text variant="label-md" tone="muted">
              Projects
            </Text>
            <Text variant="label-md" tone="muted">
              Settings
            </Text>
          </Stack>
        }
      >
        <Stack gap="sm">
          <Heading level={1} size="headline-sm">
            Main region
          </Heading>
          <Text tone="muted">
            Header over sidebar + main; each region scrolls independently.
          </Text>
        </Stack>
      </AppShell>
    );
  },
};
