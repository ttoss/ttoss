import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';

import { FOCUS_RING_OFFSET, focusRingOutline } from './focusRing';

/**
 * The box of a **hosted trigger** — a control dressed by the host surface it
 * sits on, because that host cannot read `action.*`: the "entity → ux-context
 * alignment" contract test binds a source file's colour reads to the entities
 * it declares, and a voiced host (a `Toast` declares Feedback only) must
 * dress its controls from its own subtree or they arrive with the page's
 * palette on top of a saturated fill.
 *
 * Like `EMBEDDED_TRIGGER` (a trigger inside a *field's* box) and
 * `CHOOSABLE_ROW`, it sits in the cross-cutting token layer: the silhouette
 * is one decision, and the host decides its **colours**, not its box. Both
 * colour values arrive caller-resolved — the builder never touches a colour
 * subtree, so it works for any entity whose surface hosts a control.
 *
 * ## Why it exists: one skeleton, written twice
 *
 * `Toast` hosts two triggers — the icon-only close button and the outlined
 * action — and each hand-rolled the identical skeleton around its own
 * differences: `inline-flex` centring, the control radius, the
 * pointer/disabled affordance, disabled dimming, and the floated focus ring.
 * The jscpd self-duplication was real (C-09); the parts that differ are the
 * two postures below, parametrized rather than normalized.
 *
 * ## The two postures
 *
 * - `icon` — a glyph-only dismiss affordance: a fixed `sizing.icon.lg`
 *   square, no padding, no border of its own (the host surface already draws
 *   the boundary), no typography (it renders no text).
 * - `outlined` — a labelled command: an outline silhouette rather than a
 *   fill, because the host is already a fill and a second one inside it would
 *   compete with the surface it sits on. The edge is the **ink** — the same
 *   colour as the label — so the trigger reads as part of the host's own
 *   voice and inherits its measured contrast. Set in `text.action.md`
 *   (semibold), the weight-contrast rhythm P3 Slice 3 set for command
 *   triggers.
 */
export const buildHostedTriggerStyle = ({
  posture,
  background,
  ink,
  isDisabled,
  isFocusVisible,
}: {
  /** `icon` — glyph-only dismiss box; `outlined` — labelled ink-edged command. */
  posture: 'icon' | 'outlined';
  /**
   * Caller-resolved fill for the current flags, from the **host's** colour
   * subtree. An `undefined` is emitted as nothing (React skips it) — the
   * caller owns any resting fallback (`Toast`'s close button falls back to
   * `'transparent'`, its action lets the cascade answer).
   */
  background: React.CSSProperties['background'];
  /**
   * Caller-resolved ink for the current flags. The `outlined` posture also
   * paints its edge with it — edge and label are one voice by design.
   */
  ink: React.CSSProperties['color'];
  /** Disabled: swaps the cursor and applies the disabled dimming. */
  isDisabled?: boolean;
  /** Keyboard focus: shows the cross-cutting focus ring, floated. */
  isFocusVisible?: boolean;
}): React.CSSProperties => {
  return {
    boxSizing: 'border-box',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...(posture === 'icon'
      ? {
          flexShrink: 0,
          width: vars.sizing.icon.lg,
          height: vars.sizing.icon.lg,
          padding: 0,
          border: 'none',
        }
      : {
          alignSelf: 'flex-start',
          paddingBlock: vars.spacing.inset.control.sm,
          paddingInline: vars.spacing.inset.control.md,
          borderWidth: vars.border.outline.control.width,
          borderStyle: vars.border.outline.control.style,
          borderColor: ink,
        }),
    borderRadius: vars.radii.control,
    background,
    color: ink,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isDisabled ? vars.opacity.disabled : undefined,
    outline: focusRingOutline(isFocusVisible),
    outlineOffset: FOCUS_RING_OFFSET,
    ...(posture === 'outlined'
      ? (vars.text.action.md as React.CSSProperties)
      : undefined),
  };
};
