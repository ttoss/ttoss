import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';

import type { ComponentMeta, EvaluationsFor } from '../../semantics';
import { ICON_SLOT_STYLE } from '../../tokens/iconSlot';
import { resolveValenceInk, VALENCE_GLYPH } from '../../tokens/passiveStatus';
import { Icon } from '../Icon';

// ---------------------------------------------------------------------------
// Semantic identity — Layer 1
//
// Entity = Feedback → CONTRACT.md §1 row: colours `feedback`, radii `surface`,
// border `outline.surface`, spacing `inset.surface`, typography
// `title`/`body`/`label`, elevation `flat`.
//
// `elevation: flat`, not the row's `raised` — the row lists what the entity MAY
// read, not what it must (§1 "Legal vs required"). A Toast lifts off the page
// because it floats over content; this surface sits IN the flow and lifting it
// would claim a depth it does not have.
//
// Interaction Kind = `status.passive` (FSL Lexicon §3 — "informs without
// demanding immediate user action"), which is what assigns the posture:
// `feedback.muted` for the ground, the valence confined to a mark. See
// CONTRACT §1.2 and ADR-043. This is a stated law, not a declared dimension —
// nothing dispatches on it at runtime, so it is deliberately absent from the
// meta below.
//
// Two roles of `feedback` are read, and that is the entity's own idiom rather
// than a crossing: the ground reads `feedback.muted` while the mark reads the
// valence. `ProgressBar`/`Meter` already do exactly this (quiet track, valence
// fill). CONTRACT §1 constrains the token *row* — the ux context — not the role
// within it; combining valence with emphasis in a single token PATH is what
// `colors.md` forbids, and no path here does that.
// ---------------------------------------------------------------------------

/** Formal semantic identity — InlineAlert root (Feedback entity). */
export const inlineAlertMeta = {
  displayName: 'InlineAlert',
  entity: 'Feedback',
  structure: 'root',
} as const satisfies ComponentMeta<'Feedback'>;

type FeedbackEvaluation = EvaluationsFor<(typeof inlineAlertMeta)['entity']>;

/** The quiet rung — this surface's ground in every evaluation. */
const ground = vars.colors.feedback.muted;

/**
 * Props for the InlineAlert component.
 */
export interface InlineAlertProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'style' | 'className' | 'role' | 'title' | 'children'
> {
  /**
   * Authorial valence — what the surface is reporting.
   *
   * It selects the **mark**: which glyph appears and what inks it. It does not
   * change the ground, which is the quiet rung in every evaluation — that is
   * the `status.passive` posture (CONTRACT §1.2), not a per-instance choice.
   *
   * `primary` is the neutral voice and carries **no mark**: it reports without
   * claiming a status, the same rule `Toast` applies to its own neutral rung.
   * `accent` is informative — it takes the ⓘ but keeps the prose ink, because
   * `accent` is an **Emphasis** role rather than a Valence and so has no
   * valence ink to take (FSL Lexicon §5; fsl-theme ADR-029).
   *
   * @default 'primary'
   */
  evaluation?: FeedbackEvaluation;
  /**
   * Optional short heading for the report.
   *
   * Rendered as text, **not** as a heading element: only the host knows the
   * correct outline level, and a wrong one is worse than none. `Toast` sets the
   * same precedent for a Feedback title. Compose a `Heading` in the body if the
   * report belongs in the document outline.
   *
   * Caller-supplied and caller-localized (ADR-001) — this package ships no i18n
   * runtime.
   */
  title?: React.ReactNode;
  /** The body of the report. Caller-supplied and caller-localized (ADR-001). */
  children?: React.ReactNode;
  /**
   * Optional single action — the primary path out of the condition being
   * reported ("Retry", "Reconnect", "Review the 3 fields").
   *
   * Supply a `Button` or `Link`; unlike `Toast`, this surface does not paint its
   * own trigger. A quiet neutral ground is exactly where the page's palette is
   * correct, so an ordinary Action component belongs here — the inverse of the
   * argument ADR-040 makes for re-dressing a toast's triggers on a saturated
   * fill.
   *
   * **Use `evaluation="primary"` on that action.** Measured (F-063): in dark
   * `action.secondary` resolves this ground's own value on fill *and* edge, so a
   * secondary button inside the surface disappears as an object. `primary` is
   * the only rung with real separation in both modes, and it is also the
   * semantic claim — one action, and it is the way out.
   */
  actions?: React.ReactNode;
}

/**
 * A standing report — feedback about a condition that is true *now*, in the
 * flow of the page, for as long as it holds.
 *
 * Entity = Feedback, Interaction Kind = `status.passive`. Pick it against
 * `Toast` by **who owns the lifetime**: a toast ends on a timer or a dismissal;
 * this ends when the condition ends. It occupies layout, it is idempotent
 * (rendering it twice is one state, not two notifications), and it can be
 * scrolled to.
 *
 * | You are reporting…                                        | Use            |
 * | --------------------------------------------------------- | -------------- |
 * | an event that just happened, and the report expires       | `Toast`        |
 * | a condition that holds while the page shows it            | `InlineAlert`  |
 * | something needing an answer before the user proceeds      | `DialogModal`  |
 * | a chip-sized state the system observed                    | `StatusLight`  |
 * | the result of validating what the user typed              | a field's `isInvalid` |
 *
 * The surface announces politely via `role="status"`, which is correct in both
 * arrangements without any detection: a live region does **not** announce
 * content that was already present when it was registered, so mounted with the
 * page it is silent, and inserted in response to an action it announces. Do not
 * add `aria-live` (the role already implies polite; both together double up on
 * some assistive technology) and do not name the region with `aria-labelledby`
 * (a name competes with the content it is announcing).
 *
 * @example
 * ```tsx
 * <InlineAlert evaluation="caution" title="Read-only mode">
 *   Scheduled maintenance until 22:00. Changes will not be saved.
 * </InlineAlert>
 * ```
 *
 * @example With the way out
 * ```tsx
 * <InlineAlert
 *   evaluation="negative"
 *   title={t.syncFailedTitle}
 *   actions={<Button evaluation="primary" onPress={retry}>{t.retry}</Button>}
 * >
 *   {t.syncFailedBody}
 * </InlineAlert>
 * ```
 */
export const InlineAlert = ({
  evaluation = 'primary',
  title,
  children,
  actions,
  ...props
}: InlineAlertProps) => {
  const groundInk = ground.text?.default;
  const glyph = VALENCE_GLYPH[evaluation];

  return (
    <div
      {...props}
      role="status"
      data-scope="inline-alert"
      data-part="root"
      data-evaluation={evaluation}
      style={
        {
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'flex-start',
          gap: vars.spacing.gap.inline.md,
          // `sm`, not the `md` a Toast takes — and the difference is the width
          // envelope, not the entity. ADR-031 hands every embedded surface the
          // fluid ladder without naming a rung, so this component copied the
          // rung `Toast` picked; measured in Chromium at 1280px that put 36px
          // of inset around 59px of ink, a box 55% air. A toast can afford the
          // page step because F-058 measured it inside a 420px cap; this
          // surface spans the content column, where the same step reads as
          // page padding on a component. `sm` (24px) against the reference's
          // 16px is the one-step offset this package's type ladder already
          // carries over the reference (F-021/F-047).
          padding: vars.spacing.inset.surface.sm,
          borderRadius: vars.radii.surface,
          borderWidth: vars.border.outline.surface.width,
          borderStyle: vars.border.outline.surface.style,
          // The ground's own edge, never the valence's — a valence border
          // against this fill is the cross-family border pair F-050/F-055/F-057
          // each got wrong, and the mark already carries the valence twice over
          // (shape, then ink). CONTRACT §1.2.
          borderColor: ground.border?.default,
          backgroundColor: ground.background?.default,
          color: groundInk,
        } as React.CSSProperties
      }
    >
      {glyph !== undefined && (
        <span
          data-scope="inline-alert"
          data-part="status"
          style={
            {
              // The glyph host is a centring flex box (contract invariant —
              // every `span` wrapping a glyph is), and it declares the title's
              // own type so `size="text"` resolves at 1em of the title and the
              // mark lands on the title's first line without an offset. Same
              // optical rule ADR-040 verified for `Toast`.
              ...ICON_SLOT_STYLE,
              ...(vars.text.label.md as React.CSSProperties),
              color: resolveValenceInk({ evaluation, groundInk }),
            } as React.CSSProperties
          }
        >
          <Icon intent={glyph} size="text" />
        </span>
      )}

      <div
        data-scope="inline-alert"
        data-part="content"
        style={
          {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            // A step above the title/body gap: those two are one utterance, the
            // action is a different kind of thing. The same rhythm ADR-040
            // measured for `Toast`'s content column.
            gap: vars.spacing.gap.stack.sm,
            minWidth: 0,
          } as React.CSSProperties
        }
      >
        <div
          data-scope="inline-alert"
          data-part="message"
          style={
            {
              display: 'flex',
              flexDirection: 'column',
              gap: vars.spacing.gap.stack.xs,
              minWidth: 0,
            } as React.CSSProperties
          }
        >
          {title !== undefined && (
            <span
              data-scope="inline-alert"
              data-part="title"
              style={
                {
                  // `title.sm`, not `label.md`. A title must outrank its body,
                  // and no `label.*` step can: every one is weight 400 and the
                  // largest merely ties `body.md` (F-064, contract invariant
                  // #16). The Feedback row gained `title` for this.
                  ...(vars.text.title.sm as React.CSSProperties),
                  color: groundInk,
                } as React.CSSProperties
              }
            >
              {title}
            </span>
          )}
          {children !== undefined && (
            <div
              data-scope="inline-alert"
              data-part="body"
              style={
                {
                  ...(vars.text.body.md as React.CSSProperties),
                  color: groundInk,
                } as React.CSSProperties
              }
            >
              {children}
            </div>
          )}
        </div>

        {actions !== undefined && (
          <div data-scope="inline-alert" data-part="actions">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
InlineAlert.displayName = inlineAlertMeta.displayName;
