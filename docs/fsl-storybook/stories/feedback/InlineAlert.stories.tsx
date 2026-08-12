import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, InlineAlert, Stack } from '@ttoss/fsl-ui';

const meta: Meta<typeof InlineAlert> = {
  title: 'Feedback/InlineAlert',
  component: InlineAlert,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof InlineAlert>;

export const Default: Story = {
  args: {
    title: 'Read-only mode',
    children: 'Scheduled maintenance until 22:00. Changes will not be saved.',
    evaluation: 'caution',
  },
};

/**
 * The five evaluations. The **ground does not change** — it is the quiet rung in
 * every one of them, because that is the `status.passive` posture rather than a
 * per-instance choice (CONTRACT §1.2). What changes is the mark: which glyph,
 * and what inks it.
 *
 * `primary` carries no mark at all — the neutral voice reports without claiming
 * a status. `accent` takes the ⓘ but keeps the prose ink, because `accent` is an
 * emphasis role rather than a valence and so has no valence ink.
 *
 * Read this one in **both modes**. The valence inks invert with the canvas
 * (`red.900` → `red.300`), and the quiet ground moves with it; the visual claim
 * of the whole design — that a valence can speak from a mark on a neutral box —
 * is what needs the eye, not the token names.
 */
export const Valences: Story = {
  render: () => {
    return (
      <Stack gap="sm">
        <InlineAlert evaluation="primary" title="Autosave is on">
          Your changes are saved as you type.
        </InlineAlert>
        <InlineAlert evaluation="accent" title="New in this release">
          Boards can now be shared with a link.
        </InlineAlert>
        <InlineAlert evaluation="positive" title="All checks passed">
          This branch is ready to merge.
        </InlineAlert>
        <InlineAlert evaluation="caution" title="Read-only mode">
          Scheduled maintenance until 22:00.
        </InlineAlert>
        <InlineAlert evaluation="negative" title="Sync failed">
          The last three changes were not saved.
        </InlineAlert>
      </Stack>
    );
  },
};

/**
 * One action, and it is the primary path out of the condition — the same rule
 * `Toast` applies to its single action.
 *
 * The action is an ordinary `Button`, not a trigger the surface re-dresses: a
 * quiet neutral ground is exactly where the page's palette is correct. Use
 * `evaluation="primary"` on it. Measured (F-063): in dark, `action.secondary`
 * resolves this ground's own value on fill **and** edge, so a secondary button
 * inside the surface disappears as an object.
 */
export const WithTheWayOut: Story = {
  render: () => {
    return (
      <InlineAlert
        evaluation="negative"
        title="Sync failed"
        actions={<Button evaluation="primary">Retry</Button>}
      >
        The last three changes were not saved.
      </InlineAlert>
    );
  },
};

/**
 * Title and body are each optional. A one-line report needs no heading, and a
 * heading with no body is a legitimate shape for a condition whose name is the
 * whole message.
 */
export const Shapes: Story = {
  render: () => {
    return (
      <Stack gap="sm">
        <InlineAlert evaluation="caution">
          Two fields still need attention.
        </InlineAlert>
        <InlineAlert evaluation="positive" title="Connected" />
      </Stack>
    );
  },
};

/**
 * Not a `Toast`, and the difference is **who owns the lifetime**: a toast ends on
 * a timer or a dismissal, this ends when the condition ends. It occupies layout,
 * it is idempotent — rendering it twice is one state, not two notifications — and
 * it can be scrolled to.
 *
 * Announcement follows from that: `role="status"` alone is correct in both
 * arrangements, because a live region does not announce content that was already
 * present when it was registered. Mounted with the page it is silent; inserted in
 * response to an action it announces politely. Toggle it here to see the second
 * case — with a real screen reader, which is the only instrument that can.
 */
export const AppearsInResponseToAnAction: Story = {
  render: () => {
    return (
      <Stack gap="sm" align="start">
        <p>
          Press the button, then listen: the report is announced because it was
          inserted, not because it carries an <code>aria-live</code> of its own.
        </p>
        <details>
          <summary>
            <Button evaluation="primary">Reveal the report</Button>
          </summary>
          <InlineAlert evaluation="negative" title="Sync failed">
            The last three changes were not saved.
          </InlineAlert>
        </details>
      </Stack>
    );
  },
};
