import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';

import { FOCUS_RING_OFFSET, focusRingOutline } from './focusRing';
import { resolveInteractiveStyle } from './resolveInteractiveStyle';

/**
 * Geometry of a **selection control** — the mark the user toggles: a
 * `Checkbox`'s square, a `Radio`'s circle, a `Switch`'s track, a `GridList`
 * row's selection box, a `Slider`'s handle.
 *
 * Like `CHOOSABLE_ROW` and `EMBEDDED_TRIGGER`, it sits in the cross-cutting
 * token layer rather than in a family's anatomy, and for the same reason: the
 * five consumers span three entities (`Selection`, `Collection`'s rows,
 * `Input`'s slider), the box is physically identical wherever it appears, and
 * the host decides its *colours* and never its size.
 *
 * ## Why it exists: one scale, written five times, drifting once
 *
 * `1.125rem` was hand-written in five files. Four agreed; the fifth —
 * `Switch` — had grown a `2.5rem × 1.5rem` track, which is larger than the
 * reference's **extra-large** step (34×20px desktop). A literal that happens
 * to match is indistinguishable from one that tracks until one of them moves,
 * which is the two-constants lesson (forms R2) one family over.
 *
 * ## The scale is the reference's `large` step, and that is derived
 *
 * Our field label text is 16px, which is S2's *large* type step, so the
 * control scale pairs with it: `checkbox-control-size-large` is **18px**
 * desktop — exactly the `1.125rem` four of the five files already used. The
 * glyph inside it is `checkmark-icon-size-200` (the large checkmark):
 * **12px**.
 *
 * Measured before this module existed (Chromium, 1280px, both modes): the
 * checkbox glyph rendered **20×20 inside its own 18×18 box**, because the
 * indicator asked for `Icon size="sm"` — a *container-fluid* step
 * (`clamp(14px, 0.8cqi + 11px, 20px)`) inside a fixed-size box. It overflowed
 * on any wide surface and would shrink to 14px on a phone while its box never
 * moves. That is F-021's shape one property over: a fixed box whose content
 * rides `cqi`. A glyph inside a fixed selection box must be fixed too, so
 * `glyph` is stated in rem and the hosts declare it as their `fontSize`, with
 * the `Icon` asked for `size="text"` (1em) — the ①(b) mechanism, anchored to
 * the box instead of to running text.
 *
 * ## Deliberate no-change vs the reference, recorded
 *
 * S2 draws its radio 2px smaller than its checkbox at every step (16 vs 18 at
 * large). Ours are equal on purpose: the item that created this module is
 * "one shared glyph scale", the 2px distinction carries no semantics in our
 * model, and a radio stays distinguishable by shape. One scale, one constant.
 */
export const SELECTION_CONTROL = {
  /** Box size of the mark — S2 `checkbox-control-size-large` (18px). */
  size: '1.125rem',
  /**
   * Glyph inside the mark — S2 `checkmark-icon-size-200` (12px). Fixed, not a
   * `sizing.icon` ramp step: the box it sits in is fixed.
   */
  glyph: '0.75rem',
  /**
   * Radius of a **checkbox-shaped** mark: half the control radius, because at
   * box scale (18px) the full `control` radius reads as a circle and the mark
   * becomes visually ambiguous with a `Radio` (P3 slice 3). Halving keeps the
   * curvature theme-driven. `GridList`'s selection box had kept the full
   * radius — the exact defect the slice fixed on `Checkbox`, reintroduced by
   * a second copy of the same box; single-sourcing is what retires the class.
   */
  checkboxRadius: `calc(${vars.radii.control} / 2)`,
} as const;

/**
 * The static chrome every boxed selection mark shares: a fixed square that
 * never flexes away, centring its glyph as a box (invariant #9's rule), with
 * the control border and the family's motion. The host adds its radius —
 * that is the one axis the shapes differ on (`control / 2` for a checkbox,
 * `round` for a radio) — and resolves its own colours.
 *
 * `fontSize` is declared here so anything font-relative inside the box — the
 * `Icon` asked for `size="text"`, an `em` length — resolves against the
 * glyph scale instead of against the paragraph the control happens to sit in.
 * The same load-bearing line as `EMBEDDED_TRIGGER.text`, one scale over.
 */
export const SELECTION_BOX_BASE = {
  boxSizing: 'border-box',
  flexShrink: 0,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: SELECTION_CONTROL.size,
  height: SELECTION_CONTROL.size,
  fontSize: SELECTION_CONTROL.glyph,
  borderStyle: vars.border.outline.control.style,
  transitionProperty: 'background-color, border-color, border-width',
  transitionDuration: vars.motion.feedback.duration,
  transitionTimingFunction: vars.motion.feedback.easing,
  outlineOffset: FOCUS_RING_OFFSET,
} satisfies React.CSSProperties;

/**
 * The layout every selection **group** root shares (`RadioGroup`,
 * `CheckboxGroup`): a stack of the label, the option rows, and the envelope's
 * supporting copy. Two files carried this byte-identically; the third copy is
 * the one this constant prevents.
 */
export const SELECTION_GROUP_STYLE = {
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  gap: vars.spacing.gap.stack.sm,
} satisfies React.CSSProperties;

/**
 * The colour subtree a selection control resolves its chrome from — the
 * Selection entity's CONTRACT.md §1 row names `input.primary`. The alias
 * keeps the builders' signatures honest about which dimensions they read.
 */
export type SelectionColors = typeof vars.colors.input.primary;

/**
 * Render-prop flags a selection mark resolves colour from. A host without one
 * of these states simply never sets its flag — `resolveInteractiveStyle`
 * treats an unset flag exactly like an absent one, so the shared cascade
 * costs a two-state host nothing.
 */
export interface SelectionMarkFlags {
  isSelected?: boolean;
  isIndeterminate?: boolean;
  isInvalid?: boolean;
  isDisabled?: boolean;
  isHovered?: boolean;
  isPressed?: boolean;
  isFocusVisible?: boolean;
}

/**
 * State-dependent chrome of a selection **mark** — the leaves a
 * `SELECTION_BOX_BASE`-shaped `base` leaves open. The cascade had been
 * written out once per mark and the copies agreed only by discipline; this
 * is the single statement.
 *
 * The split between the two colour cascades is deliberate and must not be
 * "completed": `background` reacts to hover/press but never to focus — the
 * ring carries focus, and a `focused` key would otherwise pre-empt the hover
 * fill — while `border` reacts to focus but never to hover/press. The same
 * division `Field`'s anatomy fixes for field chrome.
 *
 * `selectedBorderWidth` is the one structural state change: a mark whose
 * border thickens when checked or indeterminate passes the `outline.selected`
 * width and gets the switch against `outline.control`'s resting width; a
 * mark whose border never moves omits it, and whatever width `base` declares
 * stands.
 */
export const buildSelectionMarkStyle = ({
  base,
  colors,
  flags,
  selectedBorderWidth,
}: {
  base: React.CSSProperties;
  colors: SelectionColors;
  flags: SelectionMarkFlags;
  selectedBorderWidth?: string;
}): React.CSSProperties => {
  const {
    isSelected,
    isIndeterminate,
    isInvalid,
    isDisabled,
    isHovered,
    isPressed,
    isFocusVisible,
  } = flags;

  return {
    ...base,
    ...(selectedBorderWidth !== undefined && {
      borderWidth:
        isSelected || isIndeterminate
          ? selectedBorderWidth
          : vars.border.outline.control.width,
    }),
    backgroundColor: resolveInteractiveStyle(colors.background, {
      isDisabled,
      isInvalid,
      isSelected,
      isIndeterminate,
      isHovered,
      isPressed,
    }),
    borderColor: resolveInteractiveStyle(colors.border, {
      isDisabled,
      isInvalid,
      isSelected,
      isIndeterminate,
      isFocusVisible,
    }),
    outline: focusRingOutline(isFocusVisible),
  };
};

/**
 * Ink of a selection control's label — invalid dominates disabled dominates
 * default. Resolved by hand rather than through `resolveInteractiveStyle`
 * because the order is the point: the canonical cascade puts `disabled` above
 * `invalid`, the label deliberately inverts them, and routing this through
 * the helper would flip a rendered colour.
 */
export const resolveSelectionLabelInk = ({
  text,
  isInvalid,
  isDisabled,
}: {
  text: SelectionColors['text'];
  isInvalid?: boolean;
  isDisabled?: boolean;
}): string | undefined => {
  if (isInvalid) return text?.invalid;
  if (isDisabled) return text?.disabled;
  return text?.default;
};

/**
 * The row a selection option renders: mark beside label, centred, at least a
 * hit target tall, on the control's label type. Disabled state dims and
 * re-cursors the **row** — mark, label and gap alike — which is why it
 * resolves here and not per part. Ink stays with the caller: one host tints
 * the whole line, another only its label part.
 *
 * `supportGrid` is the two-column variant for a row whose supporting copy
 * stacks beside the mark: the mark holds its own column and `start`
 * alignment keeps it on the label's first line instead of floating to the
 * middle of a two-line description.
 */
export const buildSelectionOptionRowStyle = ({
  isDisabled,
  supportGrid,
}: {
  isDisabled?: boolean;
  supportGrid?: boolean;
}): React.CSSProperties => {
  return {
    boxSizing: 'border-box',
    display: supportGrid ? 'grid' : 'inline-flex',
    gridTemplateColumns: supportGrid ? 'auto 1fr' : undefined,
    alignItems: supportGrid ? 'start' : 'center',
    gap: vars.spacing.gap.inline.sm,
    minHeight: vars.sizing.hit,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isDisabled ? vars.opacity.disabled : undefined,
    ...(vars.text.label.md as React.CSSProperties),
  } as React.CSSProperties;
};
