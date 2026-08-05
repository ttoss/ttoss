/* ==========================================================================
 * Focus — Dedicated accessibility contract for keyboard/programmatic focus.
 *
 * Cross-cutting infrastructure (model.md §6) — does not belong to a single
 * UX context. Sibling of `SemanticOverlay.scrim`.
 *
 * Distinct from `border.outline.*` — implemented via CSS `outline`, not `border`,
 * to avoid layout shift and produce clearer accessible focus indicators.
 * Must resolve to a width ≥ `border.outline.*`.
 *
 * `ring` carries `width`, `style`, and `color`. The `color` field is the
 * system-wide focus default — coexists with the per-context
 * `{ux}.{role}.border.focused` tokens; they are not duplicates.
 *
 * **The ring indicates; the per-context border tints.** They are layers, not
 * alternatives, and every focusable component uses both. The ring is drawn on
 * every entity alike and is floated off the control by `ring.offset`, so the
 * surface it must contrast against is the stratum behind the component rather
 * than the component's own fill — which is what lets one system-wide colour
 * serve a near-black pill and a near-white one. `{ux}.{role}.border.focused`
 * re-tints the component's own edge underneath it and carries no indication
 * duty of its own.
 *
 * One case inverts the emphasis: an `Input` with a `negative`/`caution` valence
 * keeps that valence in its border while focused, because dropping it would
 * make focusing an invalid field look like fixing it. The ring is unchanged.
 *
 * @see colors.md § Focus color — the ring indicates, the border tints
 *
 * @example
 * ```css
 * // Focusable profile card — no obvious {ux}: system default
 * .card:focus-visible {
 *   outline-width: var(--tt-focus-ring-width);
 *   outline-style: var(--tt-focus-ring-style);
 *   outline-color: var(--tt-focus-ring-color);
 *   outline-offset: 2px;
 * }
 *
 * // Input in error — negative valence overrides the default
 * .input--error:focus-visible {
 *   outline-color: var(--tt-colors-input-negative-border-focused);
 * }
 * ```
 *
 * @adr ADR-011 — `focus.ring` stays separate from `border.outline.*` (accessibility contract + color field).
 * ========================================================================== */

import type { SemanticBorderOutline } from './borders';
import type { TokenRef } from './primitives';

export interface SemanticFocus {
  ring: SemanticBorderOutline & {
    /**
     * Gap between the control's edge and the ring, rendered as
     * `outline-offset`.
     *
     * Floating the ring keeps it legible against the control's own fill — a
     * flush ring drowns on a filled button — and it is what makes the ring's
     * contrast a pairing against the *page* rather than against the control.
     *
     * A row inside a clipped or scrolling container has nowhere to put the
     * gap and insets the ring by its own width instead; that is a component
     * decision derived from `width`, not a second token.
     */
    offset: TokenRef<`core.border.${string}`>;
    /**
     * System-wide focus ring colour — cross-cutting infrastructure (model.md §6).
     *
     * Use this when the component has no obvious FSL Entity Kind
     * (focusable Card, profile chip, custom widget). For components with a clear
     * `{ux}`, prefer `{ux}.{role}.border.focused` instead.
     *
     * Must reference a semantic token so mode overrides remap it automatically.
     */
    color: TokenRef<`semantic.${string}`>;
  };
}
