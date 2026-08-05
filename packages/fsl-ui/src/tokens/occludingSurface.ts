import { vars } from '@ttoss/fsl-theme/vars';

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
