import type * as React from 'react';

/**
 * Categorical color mapping from a discrete feature property.
 * Explicit color assignment is defined by `mapping`. Other fields such as
 * `colors` and `palette` are adapter-specific hints and are not guaranteed to
 * participate in categorical value resolution. Values not covered by
 * `mapping` may fall back to `defaultColor`, depending on the consumer.
 */
export interface CategoricalColorBy {
  type: 'categorical';
  /**
   * Key identifying the column in the `mapData` dataset whose value drives
   * the color assignment. The adapter reads this value from
   * `feature-state.value` (written by `setFeatureState` during data join),
   * not directly from a GeoJSON feature property.
   */
  property: string;
  /** Named palette key available for adapter-specific categorical handling. */
  palette?: string;
  /** Explicit color list available for adapter-specific categorical handling. */
  colors?: string[];
  /** Explicit value-to-color overrides. */
  mapping?: Record<string, string>;
  /** Fallback color for values not covered by `mapping`. */
  defaultColor?: string;
}

/**
 * Quantitative color mapping from a numeric feature property to a palette
 * via a scale. Currently only the explicit `'threshold'` scale is supported;
 * `thresholds` defines the break points used to bucket feature values.
 */
export interface QuantitativeColorBy {
  type: 'quantitative';
  /**
   * Key identifying the column in the `mapData` dataset whose numeric value
   * drives the color assignment. The adapter reads this value from
   * `feature-state.value` (written by `setFeatureState` during data join),
   * not directly from a GeoJSON feature property.
   */
  property: string;
  /** Scale used to map numeric values into discrete color buckets. */
  scale: 'threshold';
  /** Explicit break points for the `threshold` scale. */
  thresholds?: number[];
  /** Named palette key (resolved by the adapter/consumer). */
  palette?: string;
  /** Explicit ordered list of colors; overrides `palette` when provided. */
  colors?: string[];
  /** Fallback color for missing or non-numeric values. */
  defaultColor?: string;
}

/** Declarative color-by configuration for a layer. */
export type ColorBy = CategoricalColorBy | QuantitativeColorBy;

/**
 * Categorical color template (used inside `LayerTemplate`). Identical to
 * `CategoricalColorBy` but without `property`: the property is injected from
 * the template's `properties[]` at expansion time.
 */
export type CategoricalColorByTemplate = Omit<CategoricalColorBy, 'property'>;

/**
 * Quantitative color template (used inside `LayerTemplate`). Identical to
 * `QuantitativeColorBy` but without `property`: the property is injected
 * from the template's `properties[]` at expansion time.
 */
export type QuantitativeColorByTemplate = Omit<QuantitativeColorBy, 'property'>;

/** Color-by template for a layer template. */
export type ColorByTemplate =
  | CategoricalColorByTemplate
  | QuantitativeColorByTemplate;

/**
 * Alternative color/legend configuration exposed by a layer. Consumers MAY
 * present these as toggles; the active one is selected via `activeLegendId`.
 */
export interface LegendSpec {
  id: string;
  label?: string;
  colorBy: ColorBy;
  /**
   * Display type for legend rendering.
   * - `'percentage-extended'`: renders a continuous gradient bar whose color
   *   bands are proportional to the threshold ranges, with value labels at each
   *   break point.  Suitable for sequential quantitative data where the visual
   *   weight of each class should reflect its range width.
   * When omitted the default swatch-per-class layout is used.
   */
  type?: 'percentage-extended';
  /**
   * Number of color classes in the legend.  Acts as a hint to UI components
   * (e.g. for titles like "5 classes") and can be used by auto-classification
   * utilities.  When omitted the class count is inferred from `colorBy`.
   */
  classCount?: number;
  /**
   * Bibliographic source reference rendered below the legend.
   * Accepts a plain string or any React node (e.g. an anchor element) so that
   * consumers can link directly to the data origin.
   *
   * **Serialization note:** JSON-serialized specs (validated with `validateSpec`)
   * are limited to `string` values — `JSON.stringify` cannot serialize React
   * elements and will throw or lose data. React nodes are only supported in
   * programmatic (in-memory) spec objects.
   */
  source?: string | React.ReactNode;
}
