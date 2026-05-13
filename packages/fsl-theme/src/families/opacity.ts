/* ==========================================================================
 * Opacity — Core opacity scale + Semantic opacity contracts.
 * @see opacity.md
 * ========================================================================== */

import type { CoreOpacityRef, NumericValue } from './primitives';

/** Intent-free opacity scale. Components must use `SemanticOpacity` — never this directly.
 * Invariant: `0 ≤ 25 ≤ 50 ≤ 75 ≤ 100`, all in `[0, 1]`, no two adjacent steps equal. */
export interface CoreOpacity {
  100: NumericValue;
  75: NumericValue;
  50: NumericValue;
  25: NumericValue;
  0: NumericValue;
}

/** Stable opacity contracts for components. Each must resolve to `(0, 1)` exclusive.
 *
 * Opacity is a whole-element modifier — never a substitute for a semantic
 * color, state, or hierarchy token (opacity.md §"What Opacity Should Not Do").
 * If only one dimension (background, text, border) should become translucent,
 * use a semantic color with alpha instead.
 */
export interface SemanticOpacity {
  /**
   * Backdrop dimming for a blocking foreground layer.
   * Use when rendering the layer that sits *behind* a modal, dialog, drawer, or sheet
   * to attenuate the page underneath.
   * Pair with `semantic.overlay.scrim` (the colored backdrop fill); do not use on the
   * foreground surface itself — that surface stays fully opaque.
   */
  scrim: CoreOpacityRef;
  /**
   * De-emphasis veil for content during in-flight asynchronous work.
   * Use when content must remain visible (so the user keeps spatial context) while a
   * fetch / mutation / long task is pending.
   * Do not use for permanent disabled state — that is `disabled`. Remove the moment
   * the work resolves.
   */
  loading: CoreOpacityRef;
  /**
   * Dimming for image-like media in a disabled state (avatars, thumbnails, illustrations).
   * Use when the disabled element has no semantic color contract that can carry the state
   * (i.e. it is a visual asset, not a control).
   * Do not use for disabled controls or text — those consume `{ux}.{role}.{dimension}.disabled`
   * color tokens, which carry the contrast guarantees opacity cannot.
   */
  disabled: CoreOpacityRef;
}
