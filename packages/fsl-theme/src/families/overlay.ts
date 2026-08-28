/* ==========================================================================
 * Overlay — Cross-cutting infrastructure for a surface that *occludes*.
 *
 * Sibling of `focus`: neither belongs to a single UX context. What an
 * occluding surface needs is symmetrical — the `scrim` it puts *behind*
 * itself, and the `outline` it puts *around* itself.
 *
 * `scrim` is a `RawValue` (rgba composing `semantic.opacity.scrim`) because no
 * single `TokenRef` can express a partial-opacity color. See model.md §8.
 * ========================================================================== */

import type { RawValue, TokenRef } from './primitives';

export interface SemanticOverlay {
  /** Modal backdrop color — full CSS color including alpha. */
  scrim: RawValue;
  /**
   * Boundary of a surface that **occludes content** — a popover, menu,
   * tooltip, dialog panel, drawer panel, toast.
   *
   * Cross-cutting infrastructure (model.md §6): occlusion is neither a `role`
   * (emphasis/valence) nor a `state` (runtime), and it crosses UX contexts —
   * a Menu is `informational`, a Toast is `feedback`, and both cover content —
   * so the `{ux}.{role}.{dimension}.{state}` grammar cannot ask for it in a
   * single token. Same gate and same shape as `focus.ring.color`.
   *
   * **Why it cannot be `{ux}.{role}.border.default`.** That token serves an
   * embedded surface's decorative edge and a divider inside content, where a
   * near-invisible hairline is the deliberate choice (it is a listed member of
   * the border pairing's accepted-soft inventory). An occluding boundary owes
   * the opposite: `colors.md` § Stacking names `border.outline.surface` the
   * **secondary separator** and requires *"a 1px outline at ≥ 3:1 contrast
   * against the adjacent background … even when shadow is suppressed
   * (high-contrast preferences, print)"*. One token cannot be both a hairline
   * and a boundary; before this existed every overlay took the hairline and,
   * with `elevation` suppressed, lost its edge entirely.
   *
   * **Not evaluation-driven, and nothing is lost by that.** A boundary says
   * "your content resumes here", which is infrastructure rather than voice —
   * the same argument that gives the focus ring one system-wide colour.
   * Measured before the change: `informational.{primary,secondary,muted}`
   * resolved the *same* border value in both modes, so the `evaluation` prop
   * never varied an overlay's edge.
   *
   * Must reference a core colour. One value per mode clears the ≥3:1 floor
   * against every stratum an overlay can land on — page, both tonal lifts, a
   * row fill and a voiced surface — which is why this is one token and not a
   * per-stratum family. The pairing that proves it is in `colors.test.ts`
   * ("occluding boundary"); it is a cross-stratum pair, so the same-role
   * border extractor cannot see it.
   */
  outline: TokenRef<`core.colors.${string}`>;
}
