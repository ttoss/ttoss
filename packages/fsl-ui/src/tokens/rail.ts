import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';

/**
 * Geometry of a **rail** — the thin pill track a value travels along:
 * `ProgressBar`'s activity bar, `Meter`'s level bar, `Slider`'s range track.
 *
 * Like `SELECTION_CONTROL` and `CHOOSABLE_ROW`, it sits in the cross-cutting
 * token layer rather than in a family's anatomy, and for the same reason: the
 * three consumers span two entities (`Feedback`, `Input`), the rail is
 * physically identical wherever it appears, and only its colours differ.
 *
 * ## Why it exists: one silhouette, written three times
 *
 * P3 slice 3 ruled "three rails, one answer" and set the thickness to the
 * reference's `progress-bar-thickness-medium` / `meter-thickness-medium`
 * (**6px** desktop). The ruling was then written out three times — `'6px'` in
 * `ProgressBar`, `'6px'` in `Meter`, `'0.375rem'` in `Slider` — in two
 * different units. Three literals that agree today are indistinguishable from
 * three that track, until one moves (the two-constants lesson, forms R2).
 *
 * ## The floor is the reference's, and it is a floor a rail actually needs
 *
 * A rail is declared `width: 100%`, so in a narrow flex or grid cell it
 * collapses toward zero and the value it encodes disappears while the
 * component still renders. The reference sets `progress-bar-minimum-width` and
 * `meter-minimum-width` at **48px**; ours had no floor at all — the same shape
 * as F-046, where `Dialog` had a ceiling and no floor. The ceiling half is
 * deliberately *not* taken here: the reference caps a bar at 768px, and
 * whether a rail fills its container or caps is an authorial question with no
 * measurement behind it (recorded in F-051).
 */
export const TRACK_RAIL = {
  /**
   * Rail thickness — the reference's `*-thickness-medium` (6px), in rem so it
   * follows a root-size change like every other fixed step in the package.
   */
  thickness: '0.375rem',
  /**
   * Width floor — the reference's `progress-bar-minimum-width` /
   * `meter-minimum-width` (48px). Below this a rail stops carrying a readable
   * proportion.
   */
  minWidth: '3rem',
} as const;

/**
 * The chrome every rail shares: a fixed-height pill that fills its inline
 * space down to the floor and clips the fill to its own radius. The host adds
 * the rail's `backgroundColor` — that is the one axis the three consumers
 * genuinely differ on, and the axis F-050 is about.
 */
export const RAIL_BASE = {
  boxSizing: 'border-box',
  position: 'relative',
  overflow: 'hidden',
  width: '100%',
  minWidth: TRACK_RAIL.minWidth,
  height: TRACK_RAIL.thickness,
  borderRadius: vars.radii.round,
} satisfies React.CSSProperties;

/**
 * The rail colour the two `Feedback` rails share.
 *
 * It is the entity's **quiet surface**, which is what both the family's own
 * docs and `baseTheme`'s `feedback` comment already said it was — _"`muted`
 * stays a tinted neutral surface — the rail/track color for Feedback fills
 * (ProgressBar, Meter)"_. The components read `muted.border` instead, and in
 * dark that is `neutral.500`: byte-identical to `feedback.primary.background`,
 * so `<ProgressBar evaluation="primary" />` rendered a uniform grey rail with
 * no visible fill (F-050, measured 1.00:1). A border remaps *lighter* on a
 * dark canvas because an edge must stay visible; a rail must remap *darker*
 * because the fill is the thing that speaks — one token cannot do both, which
 * is why the reference keeps `track-color` as its own address (light
 * `rgb(218,218,218)` → dark `rgb(57,57,57)`, i.e. it darkens).
 *
 * Reading the quiet surface is the reuse that closes the byte-identity without
 * growing the vocabulary: dark lands on `neutral.700` (`#3d3d3d`), four units
 * off the reference's own dark track. What it costs is stated in F-050 — in
 * light the rail is quieter than the reference's (1.14:1 against the page
 * versus their 1.40:1), which is the half a dedicated address would recover.
 */
export const FEEDBACK_RAIL_FILL =
  vars.colors.feedback.muted.background?.default;
