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
 * Controls how quantitative legend bin labels are formatted.
 *
 * - `'range'`      – raw break values joined by a configurable separator.
 *   Example: `50k – 100k`.
 * - `'count'`      – compact integer counts with optional SI abbreviation.
 *   Example: `< 50k`, `50k ≤ 100k`, `> 250k`.
 * - `'percentage'` – percentage display for values already in the [0, 1] range.
 *   Example: `0% – 10%`.
 * - `'stdDev'`     – standard deviation labels for diverging schemes.
 *   Example: `< −2σ`, `−1σ – +1σ`, `> +2σ`.
 * - `'custom'`     – escape hatch; caller supplies a `formatter` function.
 * - `'auto'`       – heuristic detection (falls back to range-style output).
 *
 * All variants support an optional `extended` flag. When `true`, a semantic
 * suffix derived from the legend's `normalization` metadata is appended to
 * each label (e.g. unit, ratio, rate description).
 */
export type LabelFormatSpec =
  | { type: 'range'; separator?: string; unit?: string; extended?: boolean }
  | { type: 'count'; abbreviate?: boolean; extended?: boolean }
  | {
      type: 'percentage';
      decimals?: number;
      denominator?: number;
      extended?: boolean;
    }
  | { type: 'stdDev'; unit?: 'σ' | 'sd'; extended?: boolean }
  | {
      type: 'custom';
      /**
       * Custom formatter function. Receives the lower and upper bounds
       * (null for open-ended bins) and the zero-based bin index.
       * Not serialisable to JSON — use this only in TypeScript-driven specs.
       */
      formatter: (
        lower: number | null,
        upper: number | null,
        index: number
      ) => string;
      extended?: boolean;
    }
  | { type: 'auto'; extended?: boolean }
  | {
      /**
       * Explicit label list. Each entry maps to the bin at the same position
       * (zero-based). Bins without a corresponding entry fall back to the
       * default range-style formatting (`< N`, `N - M`, `> N`).
       *
       * This variant is JSON-serialisable and is the recommended choice when
       * the label text is known ahead of time (e.g. classification categories
       * such as `'Low'`, `'Medium'`, `'High'`). Prefer `'custom'` only when
       * runtime computation is needed.
       */
      type: 'labels';
      /** Ordered list of explicit labels, one entry per legend bin. */
      labels: string[];
      extended?: boolean;
    };

/**
 * Describes the statistical normalisation applied to the mapped data values.
 * This metadata is used to enrich legend bin labels when `extended: true` is
 * set on the `labelFormat` spec.
 */
export type NormalizationSpec =
  | {
      type: 'raw';
      /** Optional unit label appended when `extended: true`. */
      numeratorLabel?: string;
    }
  | {
      type: 'ratio';
      numeratorLabel: string;
      denominatorLabel: string;
    }
  | {
      type: 'percentage';
      numeratorLabel: string;
      denominatorLabel: string;
    }
  | {
      type: 'rate';
      numeratorLabel: string;
      denominatorLabel: string;
      /** The population base, e.g. `100000` for "cases per 100k inhabitants". */
      rateBase: number;
    };

/**
 * Named corner positions for an absolutely-positioned legend overlay.
 * Consumed by `GeoVisLegend` to apply CSS absolute positioning independently
 * of the map engine.
 */
export type LegendPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

/**
 * Alternative color/legend configuration exposed by a layer. Consumers MAY
 * present these as toggles; the active one is selected via `activeLegendId`.
 *
 * Labels are always derived from the class breaks calculated by the
 * application's classification pipeline — not from manually provided text.
 * Use `labelFormat` to control how those breaks are formatted for display.
 */
export interface LegendSpec {
  /** Unique identifier used to resolve this legend from `GeoVisLegend`. */
  id: string;
  /** Short heading rendered above the legend swatches. */
  title?: string;
  /** Secondary description rendered below the title. */
  subtitle?: string;
  /**
   * Controls how quantitative bin labels are generated.
   * When omitted the default `range` style is used.
   */
  labelFormat?: LabelFormatSpec;
  /**
   * Normalisation metadata for the mapped values.
   * Used to append semantic suffixes when `labelFormat.extended` is `true`.
   */
  normalization?: NormalizationSpec;
  /**
   * Corner position for an absolutely-positioned legend overlay.
   * When provided, `GeoVisLegend` applies CSS absolute positioning so the
   * legend can be overlaid on the map without coupling to the map engine.
   * When omitted the component renders in normal document flow and the caller
   * is responsible for positioning.
   */
  position?: LegendPosition;
  /**
   * Label for the "no data" swatch rendered at the bottom of the legend.
   * When omitted no "no data" entry is shown.
   */
  noDataLabel?: string;
  /**
   * Bibliographic or institutional attribution displayed below the swatches.
   *
   * Supports plain text and an inline link syntax:
   * `{link:visible text|https://example.com}`
   *
   * @example
   * reference: 'Source: {link:IBGE Censo 2022|https://ibge.gov.br}'
   */
  reference?: string;
  colorBy: ColorBy;
}
