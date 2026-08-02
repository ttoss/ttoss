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
 * Standard gap between a control's edge and its focus ring.
 *
 * Floating the ring off the edge keeps it legible against the control's own
 * fill — a flush ring drowns on filled buttons and checked controls — and it is
 * what makes the ring's contrast a pairing against the page rather than against
 * the control. A row inside a clipped or scrolling container uses
 * `FOCUS_RING_INSET` instead: this doc used to say such rows "keep their
 * negative insets", and *bespoke* is exactly what produced two different
 * insets, one of which clips.
 *
 * Reads the theme (`semantic.focus.ring.offset`) rather than the `2px` literal
 * it shipped as. The literal was the component owning a value the theme should
 * own: no theme could retune the gap, while the reference system treats it as a
 * first-class token beside the ring's thickness (F-020).
 */
export const FOCUS_RING_OFFSET = vars.focus.ring.offset;

/**
 * Offset for a ring that must stay **inside** its own box, because outside the
 * box there is nowhere for it to go.
 *
 * Derived from the ring's own thickness rather than written as a literal,
 * because the arithmetic is the guarantee: a ring needs `offset + width` px of
 * room outside the box, so at `offset = -width` it needs **none**. A hand-picked
 * inset does not carry that property — which is why the package had two of them,
 * one of which was too small.
 *
 * Three mechanisms leave a ring with no room, and every one was measured rather
 * than assumed:
 *
 *   *scrolling* — the focused option in a scrolled `ComboBox` list sits
 *   **0.11px** from the viewport edge, so the floated `+2px` ring (4px of extent)
 *   was cut off, and `-1px` (1px of extent) still would be.
 *
 *   *clipped* — `Accordion` and `Disclosure` set `overflow: hidden` on their
 *   root, so a trigger's ring is trimmed at the item's edge.
 *
 *   *flush* — a `Table` row spans its table and sits **1px** from its edge
 *   (`overflow: visible`, `border-radius: 12px`), so a floated ring would be
 *   drawn over the table's own border and outside its rounded corner.
 *
 * Only the negated width survives all three, and it keeps surviving if the theme
 * changes the ring's thickness.
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
