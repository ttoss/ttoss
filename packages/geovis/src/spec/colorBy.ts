import type {
  CategoricalColorBy,
  ColorBy,
  ColorByExpression,
  GeoJSONFeature,
  QuantitativeColorBy,
} from './types';

const DEFAULT_PALETTE = ['#eff3ff', '#bdd7e7', '#6baed6', '#3182bd', '#08519c'];

const NAMED_PALETTES: Record<string, string[]> = {
  Blues: DEFAULT_PALETTE,
};

const toFiniteNumber = (value: unknown): number | null => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

/**
 * JS-side evaluator for a `ColorByExpression` against a single feature's
 * `properties`. Mirrors the MapLibre expression semantics so the legend
 * (which has no GL context) computes the same numeric value the paint does.
 *
 * Returns `null` when any operand cannot be coerced to a finite number \u2014
 * features with missing or non-numeric data are excluded from break
 * computation.
 */
export const evaluateColorByExpression = (
  expr: ColorByExpression,
  properties: Record<string, unknown> | null | undefined
): number | null => {
  if (typeof expr === 'number') return expr;
  if (!Array.isArray(expr)) return null;

  const op = expr[0];

  if (op === 'get') {
    return toFiniteNumber(properties?.[expr[1] as string]);
  }
  if (op === 'to-number') {
    return evaluateColorByExpression(expr[1] as ColorByExpression, properties);
  }
  if (op === '/' || op === '*' || op === '+' || op === '-') {
    const a = evaluateColorByExpression(
      expr[1] as ColorByExpression,
      properties
    );
    const b = evaluateColorByExpression(
      expr[2] as ColorByExpression,
      properties
    );
    if (a === null || b === null) return null;
    if (op === '/') return b === 0 ? null : a / b;
    if (op === '*') return a * b;
    if (op === '+') return a + b;
    return a - b;
  }
  return null;
};

/**
 * Returns the numeric extractor a `ColorBy` uses to derive its quantitative
 * value: `expression` takes precedence over `property`. Returns `null` when
 * neither is configured (the caller should treat this as invalid input).
 */
const getQuantitativeReader = (colorBy: {
  property?: string;
  expression?: ColorByExpression;
}): ((f: GeoJSONFeature) => number | null) | null => {
  if (colorBy.expression !== undefined) {
    const expr = colorBy.expression;
    return (f) => {
      return evaluateColorByExpression(expr, f.properties);
    };
  }
  if (colorBy.property) {
    const prop = colorBy.property;
    return (f) => {
      return toFiniteNumber(f.properties?.[prop]);
    };
  }
  return null;
};

/**
 * Returns the categorical key extractor for a `ColorBy`. Currently expressions
 * are not supported for categorical colouring \u2014 the property must be set.
 */
const getCategoricalReader = (colorBy: {
  property?: string;
}): ((f: GeoJSONFeature) => string | null) | null => {
  if (!colorBy.property) return null;
  const prop = colorBy.property;
  return (f) => {
    const raw = f.properties?.[prop];
    return raw == null ? null : String(raw);
  };
};

/**
 * Builds the MapLibre paint expression accessor for the colouring dimension.
 * Used by the adapter to construct `['step', <accessor>, ...]` and
 * `['match', <accessor>, ...]` paint expressions.
 *
 * - `expression` \u2192 used verbatim (already a valid MapLibre expression).
 * - `property` \u2192 wrapped in `['to-number', ['get', property]]` for
 *   quantitative scales and `['to-string', ['get', property]]` for categorical.
 */
export const buildColorByAccessor = (colorBy: ColorBy): unknown[] | null => {
  if (colorBy.expression !== undefined) {
    return colorBy.expression as unknown as unknown[];
  }
  if (!colorBy.property) return null;
  if (colorBy.type !== 'categorical') {
    return ['to-number', ['get', colorBy.property]];
  }
  return ['to-string', ['get', colorBy.property]];
};

/**
 * Resolves the active colour ramp for a `ColorBy` configuration, in priority
 * order: explicit `colors` array, named `palette`, then the default Blues 5 ramp.
 */
export const resolveColorByPalette = (colorBy: ColorBy): string[] => {
  if (colorBy.colors && colorBy.colors.length > 0) {
    return colorBy.colors;
  }
  if (colorBy.palette && NAMED_PALETTES[colorBy.palette]) {
    return NAMED_PALETTES[colorBy.palette];
  }
  return DEFAULT_PALETTE;
};

/**
 * Computes `bins - 1` quantile break-points from a sorted-unique value array.
 * Returns fewer entries when the data lacks enough distinct values.
 */
export const computeQuantileBreaks = (
  values: number[],
  bins: number
): number[] => {
  if (values.length === 0 || bins <= 1) return [];
  const sorted = values.slice().sort((a, b) => {
    return a - b;
  });
  const breaks: number[] = [];
  for (let i = 1; i < bins; i++) {
    const index = Math.floor((i / bins) * sorted.length);
    breaks.push(sorted[Math.min(index, sorted.length - 1)]);
  }
  // Deduplicate: MapLibre `step` expressions require strictly ascending
  // thresholds. Duplicate breaks arise when many features share the same
  // value (e.g. a population column with many zeros).
  return [...new Set(breaks)];
};

/**
 * Resolved breaks for a `QuantitativeColorBy` after applying defaults and
 * computing thresholds from data when none are explicit in the spec.
 */
export interface ResolvedQuantitativeColorBy {
  type: 'quantitative';
  /** Source feature property when colouring by `property`. */
  property?: string;
  /** Source expression when colouring by a derived metric. */
  expression?: ColorByExpression;
  /** Final colour ramp used for the legend gradient and paint expression. */
  palette: string[];
  /** Colour applied to values below the first threshold. */
  defaultColor: string;
  /** Final threshold values \u2014 always non-empty when features are available. */
  thresholds: number[];
}

/**
 * Resolves a `QuantitativeColorBy` against a feature collection. When the
 * spec omits `thresholds`, computes them from data using the configured
 * `scale` (`quantile`, `linear`, or fall back to `quantile`).
 *
 * Returns `null` when no numeric values can be extracted from `features`.
 */
export const resolveQuantitativeColorBy = (
  colorBy: ColorBy,
  features: GeoJSONFeature[]
): ResolvedQuantitativeColorBy | null => {
  const qColorBy = colorBy as QuantitativeColorBy;
  const reader = getQuantitativeReader(colorBy);
  if (!reader) return null;

  const values = features.map(reader).filter((v): v is number => {
    return v !== null;
  });
  if (values.length === 0) return null;

  const palette = resolveColorByPalette(colorBy);
  const defaultColor = colorBy.defaultColor ?? palette[0];

  let thresholds: number[] = [];
  const scale = qColorBy.scale ?? 'quantile';
  if (scale === 'threshold' && qColorBy.thresholds?.length) {
    thresholds = qColorBy.thresholds;
  } else if (scale === 'linear') {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const bins = Math.max(2, qColorBy.bins ?? palette.length);
    if (max > min) {
      const step = (max - min) / bins;
      thresholds = Array.from({ length: bins - 1 }, (_, i) => {
        return min + step * (i + 1);
      });
    }
  } else {
    const bins = Math.max(2, qColorBy.bins ?? palette.length);
    thresholds = computeQuantileBreaks(values, bins);
  }

  return {
    type: 'quantitative',
    property: colorBy.property,
    expression: colorBy.expression,
    palette,
    defaultColor,
    thresholds,
  };
};

/**
 * Resolved categorical mapping after applying explicit overrides and palette
 * cycling for unmapped values discovered in the feature set.
 */
export interface ResolvedCategoricalColorBy {
  type: 'categorical';
  property: string;
  palette: string[];
  defaultColor: string;
  /** value \u2192 colour for every distinct value seen in `features`. */
  mapping: Record<string, string>;
}

export const resolveCategoricalColorBy = (
  colorBy: ColorBy,
  features: GeoJSONFeature[]
): ResolvedCategoricalColorBy | null => {
  const reader = getCategoricalReader(colorBy);
  if (!reader) return null;

  const palette = resolveColorByPalette(colorBy);
  const cColorBy = colorBy as CategoricalColorBy;
  const explicit = cColorBy.mapping ?? {};
  const defaultColor = colorBy.defaultColor ?? palette[0];

  const mapping: Record<string, string> = { ...explicit };
  let colorIndex = 0;
  for (const feature of features) {
    const key = reader(feature);
    if (key === null) continue;
    if (mapping[key]) continue;
    mapping[key] = palette[colorIndex % palette.length] ?? defaultColor;
    colorIndex += 1;
  }

  return {
    type: 'categorical',
    property: colorBy.property as string,
    palette,
    defaultColor,
    mapping,
  };
};

export type ResolvedColorBy =
  | ResolvedQuantitativeColorBy
  | ResolvedCategoricalColorBy;

/**
 * Resolves any `ColorBy` against a feature collection \u2014 dispatches to the
 * quantitative or categorical resolver based on `colorBy.type` (defaults to
 * `'quantitative'` when omitted).
 */
export const resolveColorBy = (
  colorBy: ColorBy,
  features: GeoJSONFeature[]
): ResolvedColorBy | null => {
  if (colorBy.type === 'categorical') {
    return resolveCategoricalColorBy(colorBy, features);
  }
  return resolveQuantitativeColorBy(colorBy, features);
};
