import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Button,
  Container,
  Grid,
  InlineAlert,
  Stack,
  Text,
} from '@ttoss/fsl-ui';

/**
 * Every story here renders inside a `Container` — not decoration, and not
 * optional. This theme's type and spacing are **container-fluid** (`cqi`
 * clamps), and per ADR-011 only a definite-width layout primitive establishes
 * the size container they resolve against. A story that omits one shows the
 * clamp's *viewport* end at every width, so a narrow surface renders with
 * page-scale type — F-018, and it is what an earlier revision of this file did.
 * A catalog that lies about scale is worse than no catalog.
 */
const meta: Meta<typeof InlineAlert> = {
  title: 'Feedback/InlineAlert',
  component: InlineAlert,
  tags: ['autodocs'],
  decorators: [
    (Story) => {
      return (
        <Container size="surface" gutter="none">
          <Story />
        </Container>
      );
    },
  ],
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
 * every one of them, because that is the `status.passive` posture (CONTRACT
 * §1.2) rather than a per-instance choice. What changes is the mark: which
 * glyph, and what inks it.
 *
 * `primary` carries no mark at all — the neutral voice reports without claiming
 * a status. `accent` takes the ⓘ but keeps the prose ink, because `accent` is an
 * Emphasis role rather than a Valence and so has no valence ink (FSL Lexicon §5).
 *
 * Read this one in **both modes**. The valence inks invert with the canvas
 * (`red.900` → `red.300`) and the quiet ground moves with them; the claim the
 * whole design rests on — that a valence can speak from a mark on a neutral box
 * — is what needs the eye, not the token names.
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
 * The fluid engine, doing its job. Each column is a `Grid` track, and a track
 * has a definite width, so each one is its own size container (ADR-011) — the
 * type, the inset and the gaps all resolve against the column rather than
 * against the page.
 *
 * This is the story to check when a surface "looks disproportionate": the same
 * component at three widths should read as one design at three sizes, not as
 * page-scale type crammed into a narrow box. If it does the latter, the missing
 * piece is a container in the ancestry, not a value in the component.
 */
export const ScalesToItsContainer: Story = {
  render: () => {
    return (
      <Grid columns={3} gap="md">
        <InlineAlert evaluation="negative" title="Sync failed">
          The last three changes were not saved.
        </InlineAlert>
        <InlineAlert evaluation="caution" title="Read-only mode">
          Scheduled maintenance until 22:00.
        </InlineAlert>
        <InlineAlert evaluation="positive" title="All checks passed">
          This branch is ready to merge.
        </InlineAlert>
      </Grid>
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
 * it is idempotent — rendering it twice is one state, not two notifications —
 * and it can be scrolled to.
 *
 * Announcement follows from that: `role="status"` alone is correct in both
 * arrangements, because a live region does not announce content that was already
 * present when it was registered. Mounted with the page it is silent; inserted
 * in response to an action it announces politely.
 *
 * **This story needs a real screen reader** — the announcement is the assertion,
 * and no unit test or contact sheet can observe it. Turn one on, press the
 * button, and listen for the report without touching focus.
 */
export const AppearsInResponseToAnAction: Story = {
  render: () => {
    return (
      <Stack gap="sm" align="start">
        <Text as="p">
          Press the button, then listen: the report is announced because it was
          inserted, not because it carries an <code>aria-live</code> of its own.
        </Text>
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
