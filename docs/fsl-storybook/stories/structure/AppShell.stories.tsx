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

/**
 * The narrow shape. `temporary` drops the sidebar's grid track and moves the
 * panel into a `Drawer` reached from a trigger the shell places at the inline
 * start of the header row — the answer to a shell that would otherwise
 * overflow a phone (F-023).
 *
 * Choosing between `permanent` and `temporary` is the app's call, not the
 * shell's: the app knows its own breakpoints. This is the same line MUI draws
 * on its Drawer and Chakra draws by composing the two shapes by hand.
 */
export const TemporarySidebar: Story = {
  render: () => {
    return (
      <AppShell
        header={<Text variant="label-lg">Acme Workspace</Text>}
        sidebarLabel="Navigation"
        sidebarTriggerLabel="Open navigation"
        sidebarVariant="temporary"
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
            No sidebar track: the main region takes the full width and the
            navigation is one press away.
          </Text>
        </Stack>
      </AppShell>
    );
  },
};
