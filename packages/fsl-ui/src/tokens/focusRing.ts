/**
 * Focus ring resolver — the cross-cutting keyboard-focus outline every
 * interactive component applies per `CONTRACT.md §3`:
 *
 *   - always via `outline` (never `border`) so focus cannot layout-shift;
 *   - always from the cross-cutting `vars.focus.ring.*` tokens (CONTRACT §1
 *     cross-cutting table), never from per-entity color subtrees.
 *
 * Companion to `resolveInteractiveStyle`: that helper owns the state
 * cascade for color dimensions; this one owns the single state-dependent
 * outline. Both exist so components never re-implement state ternaries
 * (structural tokens like radii/spacing stay literal reads by design).
 */

import { vars } from '@ttoss/fsl-theme/vars';

/**
 * Standard gap between a control's edge and its focus ring (P3 Slice 2,
 * Spectrum-derived: 2px ring + 2px gap). Floating the ring off the edge
 * keeps it legible against the control's own fill — a flush ring drowns on
 * filled buttons and checked controls. A row inside a clipped or scrolling
 * container uses `FOCUS_RING_INSET` instead: this doc used to say such rows
 * "keep their negative insets", and *bespoke* is exactly what produced two
 * different insets, one of which clips.
 */
export const FOCUS_RING_OFFSET = '2px';

/**
 * Offset for a ring that must stay **inside** its own box — a row in a
 * scrolling or clipped surface (a picker option, a menu row, a list row).
 *
 * Derived from the ring's own thickness rather than written as a literal,
 * because the arithmetic is the guarantee: a ring needs `offset + width` px of
 * room outside the box, so at `offset = -width` it needs **none** and cannot be
 * clipped at any scroll position. A hand-picked inset does not carry that
 * property, and this is not theoretical — measured in the `ComboBox` list with
 * the options scrolled, the focused row sits **0.11px** from the viewport edge
 * against a 4px ring extent, so the floated `+2px` ring was cut off; `-1px`,
 * the other inset in use, still needs 1px and still clips there. Only the
 * negated width is safe, and it stays safe if the theme changes the width.
 */
export const FOCUS_RING_INSET = `calc(-1 * ${vars.focus.ring.width})`;

/**
 * Returns the `outline` CSS value for the current focus-visible state.
 * Pair with `outlineOffset` at the call site — `FOCUS_RING_OFFSET` for the
 * standard floated ring, `FOCUS_RING_INSET` where the ring must stay inside a
 * clipped or scrolling ancestor.
 */
export const focusRingOutline = (
  isFocusVisible: boolean | undefined
): string => {
  return isFocusVisible
    ? `${vars.focus.ring.width} ${vars.focus.ring.style} ${vars.focus.ring.color}`
    : 'none';
};
