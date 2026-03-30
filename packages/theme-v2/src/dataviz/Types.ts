/* ==========================================================================
 * ttoss Design Tokens v2 — Data Visualization Extension Types
 *
 * Extends the Design Tokens v2 model with a controlled semantic layer for
 * analytical visualization: charts, dashboards, and geospatial overlays.
 *
 * Architecture (mirrors the foundation model):
 *
 *   core.dataviz   → semantic.dataviz
 *   semantic.dataviz → components / patterns
 *
 * Consumers must use semantic tokens only. Core tokens are value-only.
 *
 * Token path reference:
 * @see dataviz-model.md, dataviz-colors.md, dataviz-encodings.md
 * ========================================================================== */

import type { NumericValue, RawValue, TokenRef } from '../Types';

// ---------------------------------------------------------------------------
// Scale helpers
// ---------------------------------------------------------------------------

type Scale1To8 = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
type Scale1To7 = 1 | 2 | 3 | 4 | 5 | 6 | 7;
type Scale1To6 = 1 | 2 | 3 | 4 | 5 | 6;

// ---------------------------------------------------------------------------
// Core Dataviz
// ---------------------------------------------------------------------------

/**
 * Core analytical color palettes — intent-free, value-only.
 *
 * Paths:
 *   core.dataviz.color.qualitative.1..8
 *   core.dataviz.color.sequential.1..7
 *   core.dataviz.color.diverging.1..7
 */
export interface CoreDatavizColor {
  /**
   * Qualitative palette for categorical data.
   * 8 visually distinct, unordered hues. Non-sequential by design.
   */
  qualitative: Record<Scale1To8, RawValue>;
  /**
   * Sequential palette for ordered magnitude (low → high).
   * 7-step single-hue progression.
   */
  sequential: Record<Scale1To7, RawValue>;
  /**
   * Diverging palette for midpoint comparisons (neg ← neutral → pos).
   * 7 steps: 3 negative, 1 neutral center, 3 positive.
   */
  diverging: Record<Scale1To7, RawValue>;
}

/**
 * Core non-color encoding primitives — value-only.
 *
 * Paths:
 *   core.dataviz.shape.1..8
 *   core.dataviz.pattern.1..6
 *   core.dataviz.stroke.solid / dashed / dotted
 *   core.dataviz.opacity.context / muted / uncertainty
 */
export interface CoreDatavizEncoding {
  /** Mark shapes for categorical differentiation (e.g. 'circle', 'square'). */
  shape: Record<Scale1To8, RawValue>;
  /** Fill patterns for area/region differentiation (e.g. 'diagonal-stripes'). */
  pattern: Record<Scale1To6, RawValue>;
  /** Stroke dash patterns as SVG-compatible dash-array strings. */
  stroke: {
    solid: RawValue;
    dashed: RawValue;
    dotted: RawValue;
  };
  /**
   * Analytical opacity primitives.
   * Distinct from foundation opacity — used as encoding channels, not UI effects.
   */
  opacity: {
    /** Geographic/spatial context reduction behind overlays. */
    context: NumericValue;
    /** De-emphasis of non-highlighted data marks. */
    muted: NumericValue;
    /** Visual signal of estimated or uncertain data. */
    uncertainty: NumericValue;
  };
}

/**
 * Full core data visualization token tree.
 *
 * Placed at `theme.core.dataviz` — optional extension of `ThemeTokensV2`.
 */
export interface CoreDataviz {
  color: CoreDatavizColor;
  shape: CoreDatavizEncoding['shape'];
  pattern: CoreDatavizEncoding['pattern'];
  stroke: CoreDatavizEncoding['stroke'];
  opacity: CoreDatavizEncoding['opacity'];
}

// ---------------------------------------------------------------------------
// Semantic Dataviz
// ---------------------------------------------------------------------------

/**
 * Semantic categorical and scale color roles.
 *
 * Paths (in code: semantic.dataviz.color.*):
 *   dataviz.color.series.1..8
 *   dataviz.color.scale.sequential.1..7
 *   dataviz.color.scale.diverging.neg3..pos3
 *   dataviz.color.reference.baseline / target
 *   dataviz.color.state.highlight / muted / selected
 *   dataviz.color.status.missing / suppressed / not-applicable
 */
export interface SemanticDatavizColor {
  /**
   * Categorical series identity — 8 named, unordered roles.
   * Use for nominal categories, named series, distinct groups.
   */
  series: Record<Scale1To8, TokenRef>;

  scale: {
    /**
     * Ordered magnitude — 7 steps from low (1) to high (7).
     * Use for quantitative ranges and progressive intensity.
     */
    sequential: Record<Scale1To7, TokenRef>;
    /**
     * Midpoint comparison — 7 named positions around a true center.
     * Only use when the data has a meaningful midpoint (zero, baseline, target).
     */
    diverging: {
      neg3: TokenRef;
      neg2: TokenRef;
      neg1: TokenRef;
      /** Neutral midpoint class. */
      neutral: TokenRef;
      pos1: TokenRef;
      pos2: TokenRef;
      pos3: TokenRef;
    };
  };

  reference: {
    /** Color for a baseline or reference level (e.g. average, goal). */
    baseline: TokenRef;
    /** Color for a target or objective line. */
    target: TokenRef;
  };

  state: {
    /** Emphasized / highlighted data mark. */
    highlight: TokenRef;
    /** De-emphasized / non-highlighted data mark. */
    muted: TokenRef;
    /** User-selected or actively focused data mark. */
    selected: TokenRef;
  };

  status: {
    /** Value is absent or unavailable. */
    missing: TokenRef;
    /** Value is withheld for confidentiality or publication rules. */
    suppressed: TokenRef;
    /** Value is structurally absent (not measured or not applicable). */
    'not-applicable': TokenRef;
  };
}

/**
 * Semantic non-color encoding roles.
 *
 * Paths: dataviz.encoding.*
 */
export interface SemanticDatavizEncoding {
  shape: {
    /** Series identity through mark shape — use for redundant differentiation. */
    series: Record<Scale1To8, TokenRef>;
  };
  pattern: {
    /** Series identity through fill texture — use for filled marks and overlays. */
    series: Record<Scale1To6, TokenRef>;
  };
  stroke: {
    /** Stroke style for analytical reference guides or baselines. */
    reference: TokenRef;
    /** Stroke style for projected or forward-looking data segments. */
    forecast: TokenRef;
    /** Stroke style for uncertain or estimated bounds. */
    uncertainty: TokenRef;
  };
  opacity: {
    /** Opacity for contextual elements behind overlay data. */
    context: TokenRef;
    /** Opacity for de-emphasized (non-highlighted) data marks. */
    muted: TokenRef;
    /** Opacity for representing estimated or uncertain data visually. */
    uncertainty: TokenRef;
  };
}

/**
 * Semantic geospatial overlay roles.
 *
 * Defines only the contextual relationship between overlays and geography.
 * Geospatial overlays use `dataviz.color.*` and `dataviz.encoding.*` for
 * analytical meaning — these tokens cover only spatial context.
 *
 * Paths: dataviz.geo.*
 */
export interface SemanticDatavizGeo {
  context: {
    /** Reduced background wash for geographic base layer. */
    muted: TokenRef;
    /** Color for supportive boundary lines (region outlines, coastlines). */
    boundary: TokenRef;
    /** Color for contextual geographic labels (city names, region labels). */
    label: TokenRef;
  };
  state: {
    /** Fill or stroke for a spatially selected region. */
    selection: TokenRef;
    /** Fill or stroke for spatially focused region (keyboard / pointer focus). */
    focus: TokenRef;
  };
}

/**
 * Full semantic data visualization token tree.
 *
 * Placed at `theme.semantic.dataviz` — optional extension of `ThemeTokensV2`.
 * This is the **public API** of the Data Visualization extension.
 * Components and patterns must consume only these tokens.
 */
export interface SemanticDataviz {
  color: SemanticDatavizColor;
  encoding: SemanticDatavizEncoding;
  geo: SemanticDatavizGeo;
}
