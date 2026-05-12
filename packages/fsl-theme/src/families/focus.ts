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
 * Decision rule — which focus colour to use:
 *
 * | The component is… | Use |
 * | :--- | :--- |
 * | an `Action` / `Input` / `Navigation` / `Feedback` (clear FSL Entity Kind) | `{ux}.{role}.border.focused` (per-context) |
 * | an `Informational` surface made interactive (focusable Card, profile chip, custom widget) | `semantic.focus.ring.color` (system default) |
 * | an `Input` with `negative` or `caution` valence where focus must inherit the valence | `input.{negative|caution}.border.focused` (overrides the system default) |
 *
 * Per-context tokens answer "how does *this* `{ux}` look when focused?".
 * `focus.ring.color` answers "what is the *system* default when no `{ux}` applies?".
 * Pick by which question the component is asking — never both.
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
 *   outline-color: var(--tt-input-negative-border-focused);
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
