/* ==========================================================================
 * Sizing — Core size ramps + Semantic sizing contracts.
 * @see sizing.md
 * ========================================================================== */

import type { CoreSizingRef, RawValue } from './primitives';

type CoreSizeRampUI = Record<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8, RawValue>;

type CoreSizeRampLayout = Record<1 | 2 | 3 | 4 | 5 | 6, RawValue>;

interface CoreSizeRelative {
  em: RawValue;
  rem: RawValue;
}

interface CoreSizeBehavior {
  auto: RawValue;
  full: RawValue;
  fit: RawValue;
  min: RawValue;
  max: RawValue;
}

interface CoreSizeViewport {
  height: {
    full: RawValue;
  };
  width: {
    full: RawValue;
  };
}

/**
 * Hit target floors split by pointer type.
 *
 * A **single ergonomic floor per pointer profile** — the minimum interactive
 * target, never a visual size and never a scale. The theme defines one value;
 * `toCssVars` injects the `coarse` value under `@media (any-pointer: coarse)`.
 * (Evidence: the former three-step ramp shipped with only `base` ever consumed
 * — see ADR-020.)
 */
interface CoreSizeHit {
  /** Fine pointer (mouse/trackpad) hit target floor. */
  fine: RawValue;
  /** Coarse pointer (touch) hit target floor. */
  coarse: RawValue;
}

export interface CoreSizing {
  ramp: {
    ui: CoreSizeRampUI;
    layout: CoreSizeRampLayout;
  };
  relative: CoreSizeRelative;
  behavior: CoreSizeBehavior;
  viewport: CoreSizeViewport;
  hit: CoreSizeHit;
}

export interface SemanticSizing {
  /**
   * Ergonomic hit target — a **single interactive floor** (min interactive
   * area), not a visual size and not a scale. Enforce via `min-height` /
   * `min-width`; the visible control size comes from its inset + type, with
   * `hit` only guaranteeing the ergonomic minimum.
   *
   * Resolves to the **fine-pointer** value (`core.sizing.hit.fine`), which may
   * use `clamp(floor, preferred, max)` where `floor` is a fixed `Npx`
   * ergonomic minimum — guaranteeing accessibility while letting the rem
   * `preferred` respect user font-size. The CSS output layer (`toCssVars`)
   * automatically injects the coarse-pointer override (`core.sizing.hit.coarse`,
   * always fixed `px`) inside `@media (any-pointer: coarse)` — no component
   * code needed.
   */
  hit: CoreSizingRef;
  /**
   * Visual glyph dimensions. Set on the icon element itself; never used to
   * gate the hit target that wraps it (that is `hit.*`).
   */
  icon: {
    /** Compact glyph — dense UI, inline indicators, list-row icons. */
    sm: CoreSizingRef;
    /** Default glyph — pick this when no other step applies. */
    md: CoreSizingRef;
    /** Prominent glyph — emphasis or feature icons. */
    lg: CoreSizingRef;
  };
  /**
   * Visual identity object dimensions (avatars, profile photos, brand marks,
   * entity logos). Carries the *visual* size only — the surrounding hit target,
   * if any, is sized via `hit.*`.
   */
  identity: {
    /** Compact identity — list rows, dense lists, mention chips. */
    sm: CoreSizingRef;
    /** Default identity — toolbar, navigation, standard avatar slots. */
    md: CoreSizingRef;
    /** Prominent identity — profile cards, feature surfaces. */
    lg: CoreSizingRef;
    /** Hero identity — landing surfaces, brand-leading sections. */
    xl: CoreSizingRef;
  };
  measure: {
    /**
     * Typed as `RawValue` by design: `ch` units cannot be expressed as a core
     * token reference. Override with a validated character-based `clamp()`
     * expression only — never px or rem.
     */
    reading: RawValue;
  };
  surface: {
    /**
     * Maximum width of a structural surface (page shell, content column,
     * card / panel / dialog wrapper).
     * Use as `max-width` on the *outer* surface wrapper.
     * Pair with `gutter.page` for inline padding; do not use for line-length
     * readability — that is `measure.reading`.
     */
    maxWidth: CoreSizingRef;
  };
  viewport: {
    height: {
      /**
       * Full-height layouts using dynamic viewport units (`100dvh`).
       * Use intentionally — only when a region must occupy the full viewport
       * height (app shells, full-screen modals, mobile splash regions).
       * Do not use `100vh` directly — dynamic units handle mobile chrome correctly.
       */
      full: CoreSizingRef;
    };
    width: {
      /**
       * Full-width layouts using dynamic viewport units (`100dvw`).
       * Use intentionally — only when a region must span the full viewport
       * width (full-bleed banners, edge-to-edge surfaces).
       * Do not use `100vw` directly — dynamic units avoid scrollbar overflow.
       */
      full: CoreSizingRef;
    };
  };
}
