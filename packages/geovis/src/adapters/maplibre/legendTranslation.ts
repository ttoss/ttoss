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
}

const buildCategoricalExpression = (colorBy: CategoricalColorBy): unknown[] => {
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
    ['to-string', ['coalesce', ['feature-state', 'value'], '__missing__']],
    ...mappingEntries.flatMap(([key, color]) => {
      return [key, color];
    }),
    fallbackColor,
  ];
};

const buildQuantitativeExpression = (
  colorBy: QuantitativeColorBy,
  breaks: ReadonlyArray<number>
): unknown[] => {
  const sortedBreaks = uniqueAscending(breaks);
  const fallbackColor = resolveQuantitativeFallbackColor(colorBy, sortedBreaks);

  if (sortedBreaks.length === 0) {
    return ['literal', fallbackColor];
  }

  const palette = resolvePalette(colorBy, sortedBreaks.length + 1);

  const stepExpression: unknown[] = [
    'step',
    ['to-number', ['coalesce', ['feature-state', 'value'], 0], 0],
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
 * The expression always reads from `feature-state.value` so it remains
 * compatible with the current `mapData` write-path (`setFeatureState`).
 * Quantitative legends are translated to `step` and categorical legends to
 * `match` to keep parity with MapLibre's native branching semantics.
 *
 * @param params - Legend configuration and optional precomputed breaks.
 * @returns A MapLibre expression array suitable for `setPaintProperty`.
 */
export const buildFillColorExpression = ({
  legend,
  breaks = [],
}: BuildFillColorExpressionParams): unknown[] => {
  const colorBy = legend.colorBy;
  if (colorBy.type === 'categorical') {
    return buildCategoricalExpression(colorBy);
  }
  return buildQuantitativeExpression(colorBy, breaks);
};
