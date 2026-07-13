/* ==========================================================================
 * Elevation — Shadow recipe ramps and surface strata.
 * @see elevation.md
 * ========================================================================== */

import type { CoreColorRef, CoreElevationRef, RawValue } from './primitives';

/**
 * Open shadow recipe ramp — themes define as many levels as needed.
 * Every key referenced by a semantic token must resolve to a defined entry here.
 */
type CoreElevationLevels = Record<string, RawValue>;

/**
 * Core elevation primitives — shadow recipe ramps.
 *
 * - `level`    — base recipes (standard opacity), used by default in light themes
 * - `emphatic` — high-opacity recipes for surfaces needing stronger depth contrast
 *               (e.g., on dark or heavily-colored backgrounds)
 *
 * Both ramps are open `Record<string, RawValue>` — themes define as many levels as
 * needed. Every key referenced by a semantic token must be defined here.
 *
 * Future expansion (non-breaking): add optional sibling ramps as needed.
 * @see elevation.md
 */
export interface CoreElevation {
  /** Base shadow recipes — standard opacity, light-surface defaults. */
  level: CoreElevationLevels;
  /**
   * High-opacity shadow recipes for surfaces needing stronger depth contrast.
   * Mode-agnostic: expresses shadow weight, not a mode label.
   * Themes include this ramp when a dark alternate requires higher-opacity recipes.
   */
  emphatic?: CoreElevationLevels;
}

export interface SemanticElevation {
  /**
   * Shadow-based surface strata — the primary depth contract.
   * Maps each stratum to a shadow recipe (core elevation reference).
   */
  surface: {
    /** Surfaces flush with the page */
    flat: CoreElevationRef;
    /** Cards and panels */
    raised: CoreElevationRef;
    /** Dropdowns, popovers, floating surfaces */
    overlay: CoreElevationRef;
    /** Dialogs and blocking sheets */
    blocking: CoreElevationRef;
  };
  /**
   * Tonal overlay tokens — optional surface color treatments paired with shadows
   * to preserve depth perception in dark or heavily-colored themes.
   *
   * Each token resolves to a color overlay (e.g., `color-mix`, rgba surface).
   * Omit when the product does not use tonal elevation.
   * When present, must cover the same strata that carry visible shadows.
   * @see elevation.md — "Surface + Shadow"
   */
  tonal?: {
    /**
     * Tonal surface treatment paired with `surface.raised`.
     * Use when the raised stratum needs an additional color overlay — dark
     * themes where shadow alone is insufficient.
     * Pair with `surface.raised`; do not use without the matching shadow contract.
     */
    raised: CoreColorRef;
    /**
     * Tonal surface treatment paired with `surface.overlay`.
     * Use when the overlay stratum (dropdowns, popovers) needs reinforced
     * tonal lift over the page beneath.
     * Pair with `surface.overlay`; resolves to a stronger overlay than `tonal.raised`.
     */
    overlay: CoreColorRef;
    /**
     * Tonal surface treatment paired with `surface.blocking`.
     * Use when the blocking stratum (dialogs, sheets) needs the strongest
     * tonal separation from the page beneath the scrim.
     * Pair with `surface.blocking` and `semantic.overlay.scrim`; resolves to
     * the strongest tonal overlay in the contract.
     */
    blocking: CoreColorRef;
  };
}
