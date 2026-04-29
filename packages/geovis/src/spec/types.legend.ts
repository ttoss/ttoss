/**
 * Categorical color mapping from a discrete feature property to a palette.
 * Values are resolved in this order: explicit `mapping` entry -> next color
 * in `colors` or `palette` -> `defaultColor`.
 */
export interface CategoricalColorBy {
  type: 'categorical';
  /** Feature property whose value drives the color assignment. */
  property: string;
  /** Named palette key (resolved by the adapter/consumer). */
  palette?: string;
  /** Explicit ordered list of colors; overrides `palette` when provided. */
  colors?: string[];
  /** Explicit value-to-color overrides. */
  mapping?: Record<string, string>;
  /** Fallback color for values not covered by `mapping`, `colors`, or `palette`. */
  defaultColor?: string;
}

/**
 * Quantitative color mapping from a numeric feature property to a palette
 * via a scale. `bins` applies to bucketed scales (quantile/quantize), while
 * `thresholds` applies to explicit threshold scales.
 */
export interface QuantitativeColorBy {
  type: 'quantitative';
  /** Feature property whose numeric value drives the color assignment. */
  property: string;
  /** Scale used to map numeric values into discrete color buckets. */
  scale: 'quantile' | 'quantize' | 'linear' | 'threshold';
  /** Number of buckets for quantile/quantize scales. */
  bins?: number;
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
}
