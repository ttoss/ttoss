import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';

import { voicedSurface } from './surfaceScope';

/**
 * The boundary of a surface that **occludes content** (CONTRACT §3.5, F-044).
 *
 * ## The rule
 *
 * A surface that covers content owes a visible boundary, and it is
 * infrastructure rather than voice — one system-wide colour, like the focus
 * ring, read from the cross-cutting `overlay.outline`.
 *
 * ## Why the role's own border cannot serve
 *
 * `colors.md` § Stacking names `border.outline.surface` the **secondary
 * separator** and states its duty: *"a 1px outline at ≥ 3:1 contrast against
 * the adjacent background guarantees a perceptual edge even when shadow is
 * suppressed (high-contrast preferences, print)"*. An overlay's fill is
 * byte-identical to the page by design (the page and every contained surface
 * resolve from one background token), so `elevation` and that outline are the
 * only separators it has — and with `forced-colors` or print the shadow is
 * gone.
 *
 * `{ux}.{role}.border.default` cannot meet the duty because it already serves
 * the opposite one: an embedded card's decorative edge and a divider inside
 * content, where a near-invisible hairline is deliberate (it is a listed
 * member of the border pairing's accepted-soft inventory). Measured before
 * this shipped, that hairline read **1.31:1 in light and 1.67:1 in dark**
 * against the page it was supposed to separate from — so a menu under
 * `forced-colors` was an unbounded rectangle of page-coloured text.
 *
 * ## What is *not* lost by leaving `evaluation` behind
 *
 * Measured across both modes before the change:
 * `informational.{primary,secondary,muted}.border.default` all resolved the
 * **same** value, so an Overlay's `evaluation` prop never varied its edge.
 * The prop keeps driving what it always drove — the fill and the ink.
 *
 * ## Bounds
 *
 * Occluding surfaces only. An embedded `Surface`/`Box` keeps the hairline: it
 * sits *in* the flow, so losing its edge loses decoration, not the information
 * about where covered content resumes. That is the whole discriminant, and it
 * is why this is a component-layer decision rather than a theme-wide retune of
 * every `informational` edge.
 *
 * The pairing is guarded in fsl-theme's cross-role inventory ("occluding
 * boundary") against every stratum an overlay can land on — which is also what
 * proves one token suffices instead of a per-stratum family.
 */
export const OCCLUDING_OUTLINE = vars.overlay.outline;

/**
 * The colour subtree an occluding surface paints from. Only the resting fill
 * is read here — the ink, and every state beyond rest, stay at the call site.
 */
interface OccludingSurfaceColors {
  background?: { default?: string };
}

/**
 * The chrome every **occluding surface** shares (CONTRACT §3.5, ADR-031):
 * the surface radius, the `outline.surface` edge painted in the occluding
 * boundary above, the elevation shadow, the fill, and a suppressed UA
 * `outline` (React Aria overlays are focusable containers). Six components
 * assemble this — `Popover`, `Tooltip`, `Menu`'s popover, `Dialog`'s modal
 * surface, `Drawer`'s panel, `Toast`'s root — and until E2 each wrote it out
 * by hand: six copies that agree today are indistinguishable from six that
 * track, until one moves (the two-constants lesson, `rail.ts`).
 *
 * The axes the six genuinely differ on are parameters; everything a caller
 * owns alone (padding, knob-based min/max sizes, overflow, ink, motion,
 * z-index) stays at the caller:
 *
 * - `elevation` — the stratum's shadow: `overlay` for the five that block or
 *   anchor, `raised` for `Toast`, the one surface that lifts off the page
 *   plane without covering a specific spot.
 * - `fill` — whether the surface **publishes** itself (CONTRACT §3.4).
 *   `voiced` routes through `voicedSurface`: the page-like `primary` voice
 *   publishes on `--fsl-surface`, every other voice keeps its voice.
 *   `plain` paints without ever publishing.
 * - `corners` — a surface flush with a viewport edge (`Drawer`) squares its
 *   anchored corners, so it passes its per-corner radii here instead of the
 *   uniform `radii.surface` default. A slice parameter, not a boolean, so the
 *   uniform shorthand is never emitted next to the longhands it would fight.
 *
 * ## Constraint — the two `plain` callers are not the same case
 *
 * `Toast` is ruled: a Feedback fill is a voice at every evaluation (its
 * `primary` is `neutral.800`, not the page), and voiced fills never publish
 * (`surfaceScope` bounds, held by fsl-theme's inventory). `Tooltip` is the
 * **open question**: it is the only occluder whose page-like `primary` voice
 * does not publish. Nothing breaks today — a tooltip hosts nothing, it must
 * contain only non-interactive text — but if one ever hosts a quiet control,
 * whether its primary voice should publish like every other Overlay's is an
 * owner ruling still pending. `plain` here preserves that behaviour; it does
 * not decide the question.
 */
export const buildOccludingSurfaceStyle = ({
  evaluation = 'primary',
  colors,
  elevation,
  fill,
  corners,
}: {
  /** The surface's voice — read only by the `voiced` fill's publish rule. */
  evaluation?: string;
  /** The caller's entity colour subtree (informational or feedback). */
  colors: OccludingSurfaceColors | undefined;
  /** Depth stratum: blocking/anchored surfaces are `overlay`, Toast is `raised`. */
  elevation: 'overlay' | 'raised';
  /** `voiced` publishes the page-like primary voice; `plain` never publishes. */
  fill: 'voiced' | 'plain';
  /** Per-corner radii for a surface flush with an edge; default is the uniform surface radius. */
  corners?: React.CSSProperties;
}): React.CSSProperties => {
  const restingFill = colors?.background?.default;
  return {
    ...(corners ?? { borderRadius: vars.radii.surface }),
    borderWidth: vars.border.outline.surface.width,
    borderStyle: vars.border.outline.surface.style,
    // Occluding boundary (CONTRACT §3.5) — see above for why the role's own
    // edge cannot carry the ≥3:1 separator duty.
    borderColor: OCCLUDING_OUTLINE,
    ...(fill === 'voiced'
      ? // A hosting surface publishes itself (CONTRACT §3.4); only the
        // page-like primary voice does — a voiced surface keeps its voice.
        voicedSurface({ evaluation, color: restingFill })
      : { backgroundColor: restingFill }),
    boxShadow: vars.elevation.surface[elevation],
    outline: 'none',
  };
};
