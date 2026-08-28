import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';

import { fslVar } from './escapeHatch';

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
 * as F-046, where `Dialog` had a ceiling and no floor.
 *
 * ## The ceiling is a host knob, not a hard cap (F-052)
 *
 * The reference also sets `*-maximum-width` at **768px**, but whether a rail
 * fills its container or caps is authorial — a bar in a wide card that stops
 * at 768px changes every existing consumer's layout, and no measurement picks
 * a side. `--fsl-track-max-width` ships the reference's ceiling as an *opt-in*
 * knob (ADR-031's `--fsl-dialog-min-width` precedent) rather than a literal:
 * unset, `maxWidth` resolves to `none` and today's fluid `width: 100%` is
 * unchanged; a host that wants the reference's cap sets the property on
 * `[data-scope]` and gets 768px without a code change.
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
  /**
   * Width ceiling default — unset (`none`). The reference's 768px ships as
   * the documented value for a host to opt into via `--fsl-track-max-width`,
   * not as this default (F-052).
   */
  maxWidth: 'none',
} as const;

/**
 * The chrome every rail shares: a fixed-height pill that fills its inline
 * space down to the floor and clips the fill to its own radius. The host adds
 * the rail's `backgroundColor` — that is the one axis the three consumers
 * genuinely differ on, and the axis F-050 is about.
 *
 * `maxWidth` reads the `--fsl-track-max-width` host knob (CONTRACT.md §7),
 * defaulting to `TRACK_RAIL.maxWidth` (`none`) — a rail fills its container
 * exactly as it did before this knob existed, unless a host opts in.
 */
export const RAIL_BASE = {
  boxSizing: 'border-box',
  position: 'relative',
  overflow: 'hidden',
  width: '100%',
  minWidth: TRACK_RAIL.minWidth,
  maxWidth: fslVar('--fsl-track-max-width', TRACK_RAIL.maxWidth),
  height: TRACK_RAIL.thickness,
  borderRadius: vars.radii.round,
} satisfies React.CSSProperties;

/**
 * The rail fill all three components share — `ProgressBar`'s activity bar,
 * `Meter`'s level bar, `Slider`'s range track.
 *
 * Reads the cross-cutting `semantic.rail.track` (fsl-theme, model.md §6),
 * minted for exactly this address (F-050/F-051). Before it existed,
 * `ProgressBar`/`Meter` read `feedback.muted.background` — a better borrow
 * than the `muted.border` that shipped broken (F-050, measured 1.00:1
 * fill-vs-rail in dark), but still a borrow — and `Slider` read
 * `input.primary.background.disabled`, a *state* standing in for a *part*, so
 * an empty `Slider` rail meant "disabled" in the token model. All three now
 * read the same dedicated address; see `fsl-theme/src/families/rail.ts` for
 * the measured light/dark values and the reference delta.
 */
export const RAIL_FILL = vars.rail.track;

// ---------------------------------------------------------------------------
// The rail envelope — ADR-033 moved the silhouette here; the envelope (root
// stack, label row, track chrome, value fill) had stayed written out per
// component. Same two-constants rule: styles that agree today are
// indistinguishable from styles that track, until one moves.
// ---------------------------------------------------------------------------

/**
 * The root of a railed component: label row stacked over the track with the
 * smallest stack gap. Geometry only — the root paints nothing, so it carries
 * no colour axis to parametrize.
 */
export const RAIL_ROOT_STYLE = {
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  gap: vars.spacing.gap.stack.xs,
} satisfies React.CSSProperties;

/**
 * The label row above a rail: title at the inline start, status/output at the
 * inline end, on a shared text baseline, set in `label.md`.
 *
 * `ink` is required because it is the one axis the row genuinely differs on —
 * each entity's quiet text, never one normalized colour. The row sits on the
 * page surface, not on the fill, so an on-fill ink would vanish here.
 *
 * `gap` is opt-in: a row whose title may ellipsize needs a guaranteed gutter
 * before the status; a row with short static parts does not, and forcing one
 * on it would change its rendered layout.
 */
export const buildRailLabelRowStyle = ({
  ink,
  gap,
}: {
  ink: React.CSSProperties['color'];
  gap?: React.CSSProperties['gap'];
}): React.CSSProperties => {
  return {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    ...(gap !== undefined ? { gap } : {}),
    color: ink,
    ...(vars.text.label.md as React.CSSProperties),
  };
};

/**
 * The clipping track: `RAIL_BASE` chrome painted with the cross-cutting rail
 * fill. Correct for a rail whose value is a bar clipped to the pill; a rail
 * whose thumb must overflow it cannot use this builder — that discriminant
 * (`overflow: hidden`) is exactly what `RAIL_BASE` owns and `rail.test.tsx`
 * pins.
 */
export const buildRailTrackStyle = (): React.CSSProperties => {
  return {
    ...RAIL_BASE,
    backgroundColor: RAIL_FILL,
  };
};

/**
 * The value bar inside a clipping track. The caller supplies the two axes the
 * builder cannot know: `width` — the encoded value, or an indeterminate
 * geometry — and `color`, the evaluation's filled surface. The fill is the one
 * part of a rail that rotates with evaluation, so its colour source stays at
 * the call site rather than being resolved here. `animation` is for an
 * indeterminate sweep; left undefined it emits nothing. Width changes ease
 * with `transition.enter` — value movement is an entrance, and a rail has no
 * dismissal.
 */
export const buildRailFillStyle = ({
  width,
  color,
  animation,
}: {
  width: React.CSSProperties['width'];
  color: React.CSSProperties['backgroundColor'];
  animation?: React.CSSProperties['animation'];
}): React.CSSProperties => {
  return {
    height: '100%',
    width,
    backgroundColor: color,
    borderRadius: 'inherit',
    transitionProperty: 'width',
    transitionDuration: vars.motion.transition.enter.duration,
    transitionTimingFunction: vars.motion.transition.enter.easing,
    animation,
  };
};
