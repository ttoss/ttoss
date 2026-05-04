import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, ConfirmationDialog } from '@ttoss/ui2';

const meta: Meta<typeof ConfirmationDialog> = {
  title: 'ui2/ConfirmationDialog',
  component: ConfirmationDialog,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    consequence: {
      description:
        'Drives the confirm mechanism: `neutral`/`committing` confirm on the first click; `destructive` requires a second click within `armWindowMs` to arm-and-fire.',
      control: 'select',
      options: ['neutral', 'committing', 'destructive'],
    },
    evaluation: {
      description:
        'Authorial voice (color) for the confirm button. Orthogonal to `consequence` — a destructive flow may or may not use `negative` coloring.',
      control: 'select',
      options: ['primary', 'secondary', 'accent', 'muted', 'negative'],
    },
    platform: {
      description:
        'Forwarded to the underlying `DialogActions`. Controls action ordering (iOS vs Windows HIG).',
      control: 'radio',
      options: ['ios', 'windows'],
    },
    armWindowMs: {
      description:
        'Time window (ms) during which the destructive second click must land.',
      control: { type: 'number', min: 200, max: 10000, step: 100 },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ConfirmationDialog>;

/**
 * Neutral flow — archiving a post. Single click confirms immediately.
 * Same mechanism as `consequence="committing"`.
 */
export const Neutral: Story = {
  args: {
    trigger: <Button>Archive post</Button>,
    title: 'Archive this post?',
    confirmLabel: 'Archive',
    consequence: 'neutral',
    evaluation: 'primary',
    onConfirm: () => {
      return;
    },
    children: 'You can unarchive it later from your drafts.',
  },
};

/**
 * Committing flow — publishing. The action is expected and moves state
 * forward; no friction is added. Single click confirms.
 */
export const Committing: Story = {
  args: {
    trigger: <Button>Publish post</Button>,
    title: 'Publish this post?',
    confirmLabel: 'Publish',
    consequence: 'committing',
    evaluation: 'primary',
    onConfirm: () => {
      return;
    },
    children: 'Your post will become visible to everyone immediately.',
  },
};

/**
 * **Destructive flow — the proof that `consequence` drives behavior.**
 *
 * The same component, with only `consequence="destructive"`, enforces a
 * two-click arming protocol. The first click changes the button label and
 * sets `data-arming="true"`; the second click fires. Timeout resets silently.
 *
 * Flip `consequence` in the Controls panel: the mechanism follows.
 */
export const Destructive: Story = {
  args: {
    trigger: <Button evaluation="negative">Delete account</Button>,
    title: 'Delete account?',
    confirmLabel: 'Delete',
    armedLabel: 'Click again to confirm',
    consequence: 'destructive',
    evaluation: 'negative',
    armWindowMs: 2000,
    onConfirm: () => {
      return;
    },
    children: 'This action cannot be undone. All your data will be erased.',
  },
};
