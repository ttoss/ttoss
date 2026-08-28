import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Button,
  createToastQueue,
  Stack,
  Toast,
  ToastRegion,
} from '@ttoss/fsl-ui';

const queue = createToastQueue({ maxVisibleToasts: 5 });

const meta: Meta<typeof Toast> = {
  title: 'Feedback/Toast',
  component: Toast,
  subcomponents: { ToastRegion },
};

export default meta;

type Story = StoryObj<typeof Toast>;

export const Default: Story = {
  render: () => {
    return (
      <>
        <Stack direction="horizontal" gap="md">
          <Button
            evaluation="secondary"
            onPress={() => {
              queue.add({ title: 'Invitation sent' }, { timeout: 4000 });
            }}
          >
            Show toast
          </Button>
          <Button
            evaluation="secondary"
            onPress={() => {
              queue.add(
                {
                  title: 'Deploy failed',
                  description: 'Check the build log for details.',
                  evaluation: 'negative',
                },
                { timeout: 6000 }
              );
            }}
          >
            Show negative toast
          </Button>
        </Stack>
        <ToastRegion queue={queue} />
      </>
    );
  },
};

/**
 * The five valences, each with the glyph that carries it without colour
 * (ADR-040). `primary` is the neutral voice and deliberately has none —
 * there is no outcome for a mark to reinforce. `caution` and `negative`
 * share the alert triangle; the copy tells the two apart.
 *
 * Fired together so the stack can be read as one image, which is also how a
 * colour-vision check wants to see it.
 */
export const Valences: Story = {
  tags: ['autodocs'],
  render: () => {
    return (
      <>
        <Button
          evaluation="secondary"
          onPress={() => {
            queue.add({ title: 'Invitation sent' });
            queue.add({ title: 'Import running', evaluation: 'accent' });
            queue.add({ title: 'Changes published', evaluation: 'positive' });
            queue.add({ title: 'Quota almost full', evaluation: 'caution' });
            queue.add({ title: 'Deploy failed', evaluation: 'negative' });
          }}
        >
          Show every valence
        </Button>
        <ToastRegion queue={queue} />
      </>
    );
  },
};

/**
 * A toast that offers as well as reports. The action is an outline dressed
 * by the surface's own ink rather than a second fill, and it sits under the
 * message — outside the announced region, so a screen reader hears what
 * happened without the button label folded into the sentence.
 *
 * An actionable toast never auto-dismisses (WCAG 2.2.1): an offer that
 * expires on a timer cannot be taken. Pressing the action dismisses it, which
 * is the default — acting on a report ends the report.
 */
export const WithAction: Story = {
  tags: ['autodocs'],
  render: () => {
    return (
      <>
        <Stack direction="horizontal" gap="md">
          <Button
            evaluation="secondary"
            onPress={() => {
              queue.add({
                title: 'Message archived',
                actionLabel: 'Undo',
                onAction: () => {
                  return undefined;
                },
              });
            }}
          >
            Archive a message
          </Button>
          <Button
            evaluation="secondary"
            onPress={() => {
              queue.add({
                title: 'Deploy failed',
                description: 'The build log has the failing step.',
                evaluation: 'negative',
                actionLabel: 'Retry',
                shouldCloseOnAction: false,
                onAction: () => {
                  return undefined;
                },
              });
            }}
          >
            Fail a deploy
          </Button>
        </Stack>
        <ToastRegion queue={queue} />
      </>
    );
  },
};

/**
 * The two extremes of length the region has to hold: a bare title, and a
 * title with a description that wraps. The region clamps at 420px rather
 * than the reference's 336px desktop cap because our type ladder runs a step
 * larger — measured in Chromium, 336px costs this description a second line
 * (F-054).
 */
export const Lengths: Story = {
  tags: ['autodocs'],
  render: () => {
    return (
      <>
        <Button
          evaluation="secondary"
          onPress={() => {
            queue.add({ title: 'Saved', evaluation: 'positive' });
            queue.add({
              title: 'Sync paused',
              description:
                'Two files could not be reconciled because they changed in both places since the last sync. Resolve them to resume.',
              evaluation: 'caution',
              actionLabel: 'Resolve',
              onAction: () => {
                return undefined;
              },
            });
          }}
        >
          Show short and long
        </Button>
        <ToastRegion queue={queue} />
      </>
    );
  },
};
