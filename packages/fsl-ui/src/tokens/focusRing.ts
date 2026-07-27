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
 * filled buttons and checked controls. Components that draw the ring
 * *inside* a clipped container (menu items, table rows) keep their negative
 * insets and do not use this constant.
 */
export const FOCUS_RING_OFFSET = '2px';

/**
 * Returns the `outline` CSS value for the current focus-visible state.
 * Pair with `outlineOffset` at the call site — `FOCUS_RING_OFFSET` for the
 * standard floated ring, or a bespoke inset where the ring must stay inside
 * a clipped ancestor.
 */
export const focusRingOutline = (
  isFocusVisible: boolean | undefined
): string => {
  return isFocusVisible
    ? `${vars.focus.ring.width} ${vars.focus.ring.style} ${vars.focus.ring.color}`
    : 'none';
};
