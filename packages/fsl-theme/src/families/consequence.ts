/* ==========================================================================
 * Consequence — Cross-cutting valence ink for parts that paint no surface.
 *
 * Cross-cutting infrastructure (model.md §6) — sibling of `focus` and
 * `overlay`: the question it answers is one the `{ux}.{role}` grammar cannot
 * ask in a single token, and no single UX context owns the answer.
 *
 * A part on the quiet rung paints the stratum's own colour, so when it
 * carries a destructive consequence the ink is the only place the valence
 * can live. That ink cannot come from the part's own `{ux}`: in `action`
 * the negative valence ships as a *filled* command, so `action.negative.text`
 * is the label on that fill (near-white) — occupied, not missing. Combining
 * valence with emphasis (`action.negative.muted`) is forbidden outright
 * (colors.md § Picking a role). What remains is a system-wide default, which
 * is exactly the shape §6 sanctions.
 *
 * The structural twin is `focus.ring.color`: both render against the stratum
 * behind the component rather than a fill of its own (the ring because it is
 * floated off the edge, this ink because the quiet rung's fill *is* the
 * stratum), which is what lets one system-wide colour serve everything. Like
 * the ring, it coexists with per-context counterparts — `{ux}.{valence}.text`
 * answers "what is this ux's valence ink on its own surfaces?"; this token
 * answers "what marks a destructive part that paints nothing?".
 *
 * Consumed by `@ttoss/fsl-ui`'s `resolveConsequenceInk` alone (CONTRACT §3.3),
 * which bounds it to the quiet rung and hands the ink back at the states
 * where that rung materialises a real fill. The contrast duty is guarded in
 * `colors.test.ts` → "quiet destructive control": AA Normal against every
 * informational stratum plus the quiet rung's resting and hover fills, per
 * bundle and per mode.
 *
 * `committing` deliberately has no token: no visual projection exists and no
 * consumer waits for one — vocabulary grows on evidence, not symmetry.
 * ========================================================================== */

import type { TokenRef } from './primitives';

export interface SemanticConsequence {
  destructive: {
    /**
     * Foreground colour (text and, through `currentColor`, glyphs) for a
     * destructive part that paints no surface of its own.
     *
     * Must reference a semantic token so mode overrides remap it
     * automatically — same constraint and same reason as `focus.ring.color`.
     * The base theme aliases the standalone negative valence ink
     * (`informational.negative.text.default`); a theme may point it elsewhere
     * without touching validation messages.
     */
    ink: TokenRef<`semantic.${string}`>;
  };
}
