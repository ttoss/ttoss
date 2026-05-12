/* ==========================================================================
 * Z-Index — Core stacking-level scale + Semantic stacking contexts.
 * @see z-index.md
 * ========================================================================== */

import type { CoreZIndexRef, NumericValue } from './primitives';

/**
 * Intent-free z-index level scale. Components must use `SemanticZIndex` — never this directly.
 * Ordering invariant (strictly ascending): `level.0 < level.1 < level.2 < level.3 < level.4`.
 * `level.0` must be ≥ 0. Adjacent levels must differ by ≥ 10.
 */
type CoreZIndexLevels = Record<0 | 1 | 2 | 3 | 4, NumericValue>;

export interface CoreZIndex {
  level: CoreZIndexLevels;
}

/**
 * Stable application strata consumed by components. Top-layer browser elements
 * (modal dialogs / popovers promoted by the platform) are out of scope.
 *
 * Tokens express *cross-component layer relationships* only — never local
 * layering inside a single component, never visual depth (that is `elevation`).
 * Stratum picked must match the element's *blocking behaviour* and *persistence*,
 * not its component name (no `z.dropdown`, `z.toast`, etc.).
 */
export interface SemanticZIndex {
  layer: {
    /**
     * Page content in normal document flow.
     * Use when the element participates in the default application stratum and
     * has no claim above sibling content.
     * Do not use to "reset" stacking inside a component — local layering is
     * the component's own concern.
     */
    base: CoreZIndexRef;
    /**
     * Anchored bars that follow scroll while staying inside the app stack.
     * Use when building sticky headers, sticky navigation, or persistent
     * anchored toolbars.
     * Pair with `position: sticky`; do not use for non-anchored floating
     * surfaces — those are `overlay`.
     */
    sticky: CoreZIndexRef;
    /**
     * Non-blocking floating surfaces above sticky and base content.
     * Use when building dropdowns, menus, popovers, or floating panels that
     * the user can dismiss by interacting elsewhere.
     * Do not use for surfaces that block the page behind them — those are
     * `blocking`.
     */
    overlay: CoreZIndexRef;
    /**
     * Surfaces that sit above other overlays and prevent interaction behind them.
     * Use when building dialogs, sheets, or blocking drawers paired with a scrim.
     * Pair with `semantic.overlay.scrim` and `semantic.opacity.scrim`; do not
     * use for non-blocking floating panels — those are `overlay`.
     */
    blocking: CoreZIndexRef;
    /**
     * Highest application-controlled stratum before the browser top layer.
     * Use when building transient notifications that must surface above any
     * other app stratum (toasts, tooltip-like transient overlays).
     * Do not use for persistent UI — `transient` implies the element is
     * short-lived and self-dismissing.
     */
    transient: CoreZIndexRef;
  };
}
