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
 * Returns the `outline` CSS value for the current focus-visible state.
 * Pair with `outlineOffset` at the call site when the component floats the
 * ring off its edge.
 */
export const focusRingOutline = (
  isFocusVisible: boolean | undefined
): string => {
  return isFocusVisible
    ? `${vars.focus.ring.width} ${vars.focus.ring.style} ${vars.focus.ring.color}`
    : 'none';
};
