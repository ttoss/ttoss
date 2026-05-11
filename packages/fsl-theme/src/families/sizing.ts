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

/** Three-step hit target size ramp (min / base / prominent). */
interface CoreSizeHitScale {
  min: RawValue;
  base: RawValue;
  prominent: RawValue;
}

/**
 * Hit target sizes split by pointer type.
 * `toCssVars` automatically injects the `coarse` values under `@media (any-pointer: coarse)`.
 */
interface CoreSizeHit {
  /** Fine pointer (mouse/trackpad) hit targets */
  fine: CoreSizeHitScale;
  /** Coarse pointer (touch) hit targets */
  coarse: CoreSizeHitScale;
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
   * Ergonomic hit targets. Each token resolves to the **fine-pointer** value.
   * The CSS output layer (`toCssVars`) automatically injects coarse-pointer
   * overrides inside `@media (any-pointer: coarse)` — no component code needed.
   *
   * Fine-pointer values (`core.sizing.hit.fine.*`) may use `clamp(floor, preferred, max)`
   * where `floor` is a fixed `Npx` ergonomic minimum — this guarantees accessibility
   * while allowing themes to express density preferences (e.g. via the rem scale).
   * Coarse-pointer values (`core.sizing.hit.coarse.*`) are always fixed `px`.
   */
  hit: {
    /** Minimum interactive area for small / secondary targets (icon-only buttons, toolbar items). Enforce via `min-width` / `min-height`; not a visual size. */
    min: CoreSizingRef;
    /** Default interactive area for standard buttons, inputs, and toggles. Pick when no other step applies. */
    base: CoreSizingRef;
    /** Prominent interactive area for high-emphasis or low-density targets (CTAs, dialog actions). */
    prominent: CoreSizingRef;
  };
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
