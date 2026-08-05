/* ==========================================================================
 * Rail — Cross-cutting infrastructure for the unfilled part of a track.
 *
 * Sibling of `focus`/`overlay`/`consequence` (model.md §6). A rail is the
 * thin pill the value of a `ProgressBar`, `Meter` or `Slider` travels along —
 * it is neither a `role` (emphasis/valence) nor a `state` (runtime), and it
 * crosses UX contexts the same way `overlay.outline` does: `ProgressBar`/
 * `Meter` are `Feedback`, `Slider` is `Input`, and all three need the same
 * neutral pill behind the value they carry.
 * ========================================================================== */

import type { TokenRef } from './primitives';

export interface SemanticRail {
  /**
   * The rail's fill — the part of the track a `ProgressBar`/`Meter`'s value
   * has not yet reached, or a `Slider`'s range has not yet covered.
   *
   * fsl-ui F-050/F-051. Before this token existed, every consumer that needed
   * one borrowed a token whose meaning was something else: `ProgressBar` and
   * `Meter` took `feedback.muted.border` (an edge used as a fill; F-050
   * moved them to `feedback.muted.background`, a better borrow but still a
   * borrow), and `Slider` took `input.primary.background.disabled` — a
   * **state** used as a **part**, so a `Slider`'s empty rail meant
   * "disabled" in the token model. F-051 is the ruling that a rail gets its
   * own address instead.
   *
   * **Why cross-cutting rather than reused.** The reference
   * (`@adobe/spectrum-tokens@14.15.0`, `track-color`) ships a rail as its own
   * token, aliased to a private grey step rather than to any role's
   * dimension, because a rail's mode behaviour is its own: it **darkens** in
   * dark (light `rgb(218,218,218)` → dark `rgb(57,57,57)`) while every
   * `{ux}.{role}.border.*` in this system **lightens** on the same canvas (an
   * edge must stay visible against a near-black page). One token cannot carry
   * both directions, which is exactly the gap F-050 paid for: reusing
   * `feedback.muted.background` closed the dark blocker but left the light
   * half quieter than the reference (1.14:1 against the page vs. the
   * reference's 1.40:1, per `docs/fsl-studio/FRICTION.md` F-050/F-051).
   *
   * **Measured values, this ruling.** Light lands on `core.colors.neutral.200`
   * (`#e1e1e1`) — 7 units per channel off the reference's own `rgb(218,218,218)`
   * (225 vs. 218) — which raises the fill-vs-page separation from the
   * borrowed `neutral.100`'s 1.14:1 (F-050) to ~1.31:1, closer to the
   * reference's 1.40:1 than the borrow was. Dark lands on
   * `core.colors.neutral.700` (`#3d3d3d`) — 4 units off the reference's
   * `rgb(57,57,57)`, the same step F-050 already found closest and the reason
   * this token's dark value coincides with `feedback.muted.background`'s: F-050
   * had already found the right dark step, so this ruling keeps it and only
   * moves the light half, which is the half F-050 explicitly left owing. No
   * existing `core.colors.neutral` step sits closer to either reference value
   * than the ones chosen — see `rail.test.ts` for the per-channel deltas.
   *
   * Must reference a core colour, like `overlay.outline` — a mode-aware
   * remap through `semantic.colors.*` is not needed because nothing else
   * shares this address to remap alongside it.
   */
  track: TokenRef<`core.colors.${string}`>;
}
