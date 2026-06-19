import type { SizeBy } from '../../spec/types';
import type {
  CategoricalColorBy,
  ColorBy,
  LegendSpec,
  QuantitativeColorBy,
} from '../../spec/types.legend';

/**
 * Default 5-stop blue ramp used when a legend declares no `colors` array.
 * Exported so React-side renderers (e.g. `GeoVisLegend`) can present the
 * exact same swatches the adapter paints on the map.
 */
export const DEFAULT_LEGEND_COLORS = [
  '#dbeafe',
  '#93c5fd',
  '#60a5fa',
  '#3b82f6',
  '#1d4ed8',
];

/**
 * Neutral fallback colour used when a legend has no usable palette/default
 * colour at all. Matches the adapter's `__missing__` paint output.
 */
export const DEFAULT_MISSING_COLOR = '#9ca3af';

const uniqueAscending = (values: ReadonlyArray<number>): number[] => {
  const deduped = new Set<number>();
  for (const value of values) {
    if (!Number.isFinite(value)) continue;
    deduped.add(value);
  }
  return Array.from(deduped).sort((a, b) => {
    return a - b;
  });
};

/**
 * Resolves the colour palette for a legend, padding it with the trailing
 * colour (or {@link DEFAULT_MISSING_COLOR}) until it reaches `minimumLength`.
 * Exported so legend renderers can derive swatches consistent with the
 * MapLibre paint expression produced by {@link buildFillColorExpression}.
 */
export const resolvePalette = (
  colorBy: ColorBy,
  minimumLength: number
): string[] => {
  const seed = colorBy.colors?.length ? colorBy.colors : DEFAULT_LEGEND_COLORS;
  const palette = [...seed];
  while (palette.length < minimumLength) {
    palette.push(palette[palette.length - 1] ?? DEFAULT_MISSING_COLOR);
  }
  return palette;
};

/**
 * Returns the single fallback colour the adapter emits for a categorical
 * legend whose `mapping` is empty (`['literal', fallbackColor]`). Reused by
 * `GeoVisLegend` to keep the swatch in lockstep with the painted layer.
 */
export const resolveCategoricalFallbackColor = (
  colorBy: CategoricalColorBy
): string => {
  return colorBy.defaultColor ?? DEFAULT_MISSING_COLOR;
};

/**
 * Returns the colour used for the "below first break" bin of a quantitative
 * legend — the same value the adapter places as the `step` expression's
 * default output. Mirrors the adapter's resolution chain
 * (`defaultColor ?? palette[0] ?? DEFAULT_MISSING_COLOR`) so legend swatches
 * never disagree with the painted map.
 */
export const resolveQuantitativeFallbackColor = (
  colorBy: QuantitativeColorBy,
  breaks: ReadonlyArray<number>
): string => {
  const palette = resolvePalette(colorBy, breaks.length + 1);
  return colorBy.defaultColor ?? palette[0] ?? DEFAULT_MISSING_COLOR;
};

export interface BuildFillColorExpressionParams {
  legend: LegendSpec;
  breaks?: ReadonlyArray<number>;
  /** Feature-state key name. Defaults to 'value'. */
  stateKey?: string;
}

const buildCategoricalExpression = (
  colorBy: CategoricalColorBy,
  stateKey: string = 'value'
): unknown[] => {
  const mappingEntries = Object.entries(colorBy.mapping ?? {});
  const fallbackColor = resolveCategoricalFallbackColor(colorBy);
  // MapLibre's `match` expression requires at least one label/output pair.
  // When the categorical mapping is empty, fall back to a constant color
  // expression to avoid a runtime error from `setPaintProperty`.
  if (mappingEntries.length === 0) {
    return ['literal', fallbackColor];
  }
  return [
    'match',
    ['to-string', ['coalesce', ['feature-state', stateKey], '__missing__']],
    ...mappingEntries.flatMap(([key, color]) => {
      return [key, color];
    }),
    fallbackColor,
  ];
};

const buildQuantitativeExpression = (
  colorBy: QuantitativeColorBy,
  breaks: ReadonlyArray<number>,
  stateKey: string = 'value'
): unknown[] => {
  const sortedBreaks = uniqueAscending(breaks);
  const palette = resolvePalette(colorBy, sortedBreaks.length + 1);
  const fallbackColor = resolveQuantitativeFallbackColor(colorBy, sortedBreaks);

  const stepExpression: unknown[] = [
    'step',
    ['to-number', ['coalesce', ['feature-state', stateKey], 0], 0],
    fallbackColor,
  ];

  for (let i = 0; i < sortedBreaks.length; i += 1) {
    stepExpression.push(
      sortedBreaks[i],
      palette[i + 1] ?? palette[i] ?? fallbackColor
    );
  }

  return stepExpression;
};

/**
 * Builds a MapLibre `fill-color` expression from a legend definition.
 *
 * @remarks
 * The expression reads from `feature-state[stateKey]` to support multiple
 * independent dimensions (e.g. one for color, another for size).
 * Quantitative legends are translated to `step` and categorical legends to
 * `match` to keep parity with MapLibre's native branching semantics.
 *
 * @param params - Legend configuration, optional precomputed breaks, and stateKey.
 * @returns A MapLibre expression array suitable for `setPaintProperty`.
 */
export const buildFillColorExpression = ({
  legend,
  breaks = [],
  stateKey = 'value',
}: BuildFillColorExpressionParams): unknown[] => {
  const colorBy = legend.colorBy;
  if (colorBy.type === 'categorical') {
    return buildCategoricalExpression(colorBy, stateKey);
  }
  return buildQuantitativeExpression(colorBy, breaks, stateKey);
};

/**
 * Generates an array of `count` evenly spaced radii between `min` and `max`.
 */
const generateRadii = (count: number, min: number, max: number): number[] => {
  if (count <= 1) return [min];
  const radii: number[] = [];
  for (let i = 0; i < count; i += 1) {
    radii.push(min + ((max - min) * i) / (count - 1));
  }
  return radii;
};

const buildContinuousSizeExpression = (
  sizeBy: SizeBy,
  fallbackRadius: number,
  legendThresholds?: number[],
  stateKey: string = 'value'
): unknown => {
  const [minRadius, maxRadius] = sizeBy.range;
  const bounds = legendThresholds?.length
    ? legendThresholds
    : (sizeBy.thresholds ?? []);

  // When sqrt transform is requested, apply sqrt to the input value so that
  // output radii stay within [minRadius, maxRadius] while area ∝ value.
  const rawValue: unknown[] = ['to-number', ['feature-state', stateKey]];
  const stateValue =
    sizeBy.transform === 'sqrt' ? ['sqrt', rawValue] : rawValue;

  let interpolated: unknown;
  if (bounds.length >= 2) {
    const sorted = uniqueAscending(bounds);
    const dataMin = sorted[0]!;
    const dataMax = sorted[sorted.length - 1]!;

    interpolated = [
      'case',
      ['!=', ['feature-state', stateKey], 'undefined'],
      [
        'interpolate',
        ['linear'],
        stateValue,
        dataMin,
        minRadius,
        dataMax,
        maxRadius,
      ],
      fallbackRadius,
    ];
  } else {
    // Without data bounds, interpolate between min and max of the range itself.
    // This produces a pass-through expression that can be dynamically updated
    // when data bounds become available (e.g. after mapData is applied).
    interpolated = [
      'case',
      ['!=', ['feature-state', stateKey], 'undefined'],
      [
        'interpolate',
        ['linear'],
        stateValue,
        minRadius,
        minRadius,
        maxRadius,
        maxRadius,
      ],
      fallbackRadius,
    ];
  }

  return interpolated;
};

/**
 * Builds a MapLibre `circle-radius` expression from a `sizeBy` configuration.
 *
 * @remarks
 * Continuous mode produces an `interpolate` linear expression; stepped mode
 * produces a `step` expression with radii linearly spaced across the range.
 * When stepped mode has no explicit thresholds and no legend thresholds are
 * provided, the function falls back to continuous mode.
 *
 * @param sizeBy - Proportional symbol configuration.
 * @param fallbackRadius - Static radius used when data is missing.
 * @param legendThresholds - Break points inherited from the active legend.
 * @param stateKey - Feature-state key name. Defaults to 'value'.
 * @returns A MapLibre expression, or a constant number when data bounds are unavailable.
 */
export const buildSizeExpression = (
  sizeBy: SizeBy,
  fallbackRadius: number,
  legendThresholds?: number[],
  stateKey: string = 'value'
): unknown => {
  const [minRadius, maxRadius] = sizeBy.range;

  if (minRadius >= maxRadius || minRadius <= 0) {
    throw new Error(
      `sizeBy.range must have min < max and both > 0, got [${minRadius}, ${maxRadius}]`
    );
  }

  if (sizeBy.mode === 'stepped') {
    // Prefer the active legend's thresholds so that color bins and size bins
    // stay aligned. Fall back to sizeBy.thresholds only when no legend is
    // active.
    const breaks = legendThresholds?.length
      ? legendThresholds
      : (sizeBy.thresholds ?? []);

    if (breaks.length === 0) {
      return buildContinuousSizeExpression(
        sizeBy,
        fallbackRadius,
        undefined,
        stateKey
      );
    }

    const sortedBreaks = uniqueAscending(breaks);
    // N breaks partition the data into N+1 bins: one below the first break,
    // one between each consecutive pair, and one above the last break.
    const binCount = sortedBreaks.length + 1;
    const radii = generateRadii(binCount, minRadius, maxRadius);

    const input = ['to-number', ['feature-state', stateKey]];

    const stepped: unknown = [
      'case',
      ['!=', ['feature-state', stateKey], 'undefined'],
      [
        'step',
        input,
        radii[0],
        ...sortedBreaks.flatMap((b, i) => {
          return [b, radii[i + 1]];
        }),
      ],
      fallbackRadius,
    ];

    return stepped;
  }

  return buildContinuousSizeExpression(
    sizeBy,
    fallbackRadius,
    legendThresholds,
    stateKey
  );
};
