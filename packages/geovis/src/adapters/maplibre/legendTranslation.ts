import type { ColorBy, LegendSpec } from '../../spec/types';

const DEFAULT_LEGEND_COLORS = [
  '#dbeafe',
  '#93c5fd',
  '#60a5fa',
  '#3b82f6',
  '#1d4ed8',
];

const DEFAULT_MISSING_COLOR = '#9ca3af';

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

const resolvePalette = (colorBy: ColorBy, minimumLength: number): string[] => {
  const seed = colorBy.colors?.length ? colorBy.colors : DEFAULT_LEGEND_COLORS;
  const palette = [...seed];
  while (palette.length < minimumLength) {
    palette.push(palette[palette.length - 1] ?? DEFAULT_MISSING_COLOR);
  }
  return palette;
};

export interface BuildFillColorExpressionParams {
  legend: LegendSpec;
  breaks?: ReadonlyArray<number>;
}

const buildCategoricalExpression = (colorBy: ColorBy): unknown[] => {
  const mappingEntries = Object.entries(colorBy.mapping ?? {});
  const fallbackColor = colorBy.defaultColor ?? DEFAULT_MISSING_COLOR;
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
  colorBy: ColorBy,
  breaks: ReadonlyArray<number>
): unknown[] => {
  const sortedBreaks = uniqueAscending(breaks);
  const palette = resolvePalette(colorBy, sortedBreaks.length + 1);
  const fallbackColor =
    colorBy.defaultColor ?? palette[0] ?? DEFAULT_MISSING_COLOR;

  const stepExpression: unknown[] = [
    'step',
    ['coalesce', ['feature-state', 'value'], 0],
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
