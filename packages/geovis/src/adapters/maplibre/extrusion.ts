import type { MapData, PolygonExtrusion } from '../../spec/types';

/** Height, in metres, of the top class or largest value when none is declared. */
export const DEFAULT_EXTRUSION_MAX_HEIGHT = 3000;

export interface BuildExtrusionHeightExpressionParams {
  extrusion: PolygonExtrusion;
  /** The active threshold legend's breaks, ascending. Empty when it has none. */
  breaks: ReadonlyArray<number>;
  /** Feature-state key the layer's colour reads. */
  stateKey: string;
  /** The dataset the colour reads, whose largest value sets the continuous scale. */
  mapData?: MapData;
}

/**
 * The height of each class, lowest first: the declared `heights` padded with
 * their last entry, or `maxHeight` split into even steps. The lowest class
 * stands one step tall, never flat, so it stays apart from features with no
 * value.
 */
export const resolveClassHeights = ({
  extrusion,
  count,
}: {
  extrusion: PolygonExtrusion;
  count: number;
}): number[] => {
  const declared = extrusion.heights?.filter((height) => {
    return Number.isFinite(height);
  });
  if (declared?.length) {
    return Array.from({ length: count }, (_, index) => {
      return declared[Math.min(index, declared.length - 1)];
    });
  }
  const maxHeight = extrusion.maxHeight ?? DEFAULT_EXTRUSION_MAX_HEIGHT;
  return Array.from({ length: count }, (_, index) => {
    return (maxHeight * (index + 1)) / count;
  });
};

/** The dataset's largest finite numeric value, or `0` when it has none. */
const largestValue = (mapData: MapData | undefined): number => {
  let largest = 0;
  for (const row of mapData?.data ?? []) {
    if (typeof row.value === 'number' && Number.isFinite(row.value)) {
      largest = Math.max(largest, row.value);
    }
  }
  return largest;
};

/**
 * Builds the MapLibre `fill-extrusion-height` expression of an extruded
 * polygon layer, reading the same `feature-state` value its colour does.
 *
 * `'class'` mode steps over the legend's breaks — the same `step` the colour
 * uses, with a height per class instead of a colour. `'continuous'` mode
 * interpolates linearly from `0` (flat) to the dataset's largest value
 * (`maxHeight`); negative values clamp to flat. Either way a feature with no
 * value stays flat.
 *
 * @example
 * buildExtrusionHeightExpression({
 *   extrusion: { maxHeight: 3000 },
 *   breaks: [10, 20],
 *   stateKey: 'value',
 * });
 * // ['case', ['!=', ['feature-state', 'value'], null],
 * //   ['step', ['to-number', ['feature-state', 'value'], 0], 1000, 10, 2000, 20, 3000],
 * //   0]
 */
export const buildExtrusionHeightExpression = ({
  extrusion,
  breaks,
  stateKey,
  mapData,
}: BuildExtrusionHeightExpressionParams): unknown[] | number => {
  const value = ['to-number', ['feature-state', stateKey], 0];
  const hasValue = ['!=', ['feature-state', stateKey], null];

  if ((extrusion.mode ?? 'class') === 'class' && breaks.length > 0) {
    const heights = resolveClassHeights({
      extrusion,
      count: breaks.length + 1,
    });
    const step: unknown[] = ['step', value, heights[0]];
    for (const [index, threshold] of breaks.entries()) {
      step.push(threshold, heights[index + 1]);
    }
    return ['case', hasValue, step, 0];
  }

  const maxHeight = extrusion.maxHeight ?? DEFAULT_EXTRUSION_MAX_HEIGHT;
  const largest = largestValue(mapData);
  // `interpolate` needs strictly ascending stops: with no positive value
  // there is no scale to draw, and every prism stays flat.
  if (largest <= 0) return 0;
  return [
    'case',
    hasValue,
    ['interpolate', ['linear'], value, 0, 0, largest, maxHeight],
    0,
  ];
};
