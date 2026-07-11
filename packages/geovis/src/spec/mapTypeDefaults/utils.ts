import type { MapDataRow, VisualizationSpec } from '../types';
import { jenksBuckets } from './jenks';
import { DEFAULT_SEQUENTIAL_PALETTE } from './palettes';

/**
 * Finds the source id that matches the first mapData entry, falling back
 * to the first geojson source if no direct match is found.
 */
export const findMatchSourceId = (spec: VisualizationSpec): string => {
  const firstMapData = spec.mapData?.[0];
  if (!firstMapData) return 'unknown';

  return (
    spec.sources.find((s) => {
      return s.id === firstMapData.mapId && s.type === 'geojson';
    })?.id ??
    spec.sources.find((s) => {
      return s.type === 'geojson';
    })?.id ??
    'unknown'
  );
};
const MAX_CLASSES = DEFAULT_SEQUENTIAL_PALETTE.length - 1;

/**
 * Derives the optimal number of Jenks classes from the number of unique
 * data values. Uses `sqrt(n)` (Sturges-like heuristic) clamped between
 * 3 (minimum for visual distinction) and the palette size minus one
 * (maximum usable colours).
 */
export const computeNumClasses = (uniqueCount: number): number => {
  return Math.min(MAX_CLASSES, Math.max(3, Math.ceil(Math.sqrt(uniqueCount))));
};

export const inspectDataValues = (
  data: MapDataRow[]
): {
  isNumeric: boolean;
  numericValues: number[];
  categoricalValues: string[];
} => {
  const numericValues: number[] = [];
  const categoricalValues: string[] = [];
  let numericCount = 0;
  let totalCount = 0;

  for (const row of data) {
    if (row.value === null || row.value === undefined) continue;
    totalCount++;
    if (typeof row.value === 'number') {
      numericCount++;
      numericValues.push(row.value);
    } else {
      categoricalValues.push(String(row.value));
    }
  }

  return {
    isNumeric: totalCount > 0 && numericCount / totalCount > 0.8,
    numericValues,
    categoricalValues: [...new Set(categoricalValues)],
  };
};

export const computeJenksBreaks = (
  values: number[],
  numClasses: number
): number[] => {
  if (values.length === 0) return [];
  if (values.length <= numClasses) {
    return [...new Set(values)]
      .sort((a, b) => {
        return a - b;
      })
      .slice(1);
  }
  const breaks = jenksBuckets([...values], numClasses);
  return breaks.slice(1, -1);
};

/**
 * Rounds a positive value up to a "nice" cartographic ceiling — the smallest
 * value of the form `{1, 2, 2.5, 5, 10} × 10ⁿ` that is `>= value`. Used as the
 * default `scaleMaxValue` for proportional circles so the legend's reference
 * circles land on readable round numbers (e.g. 487 321 → 500 000) instead of
 * the raw data maximum.
 *
 * Returns `0` for non-positive or non-finite inputs (the caller treats this as
 * "no usable ceiling" and leaves `scaleMaxValue` unset).
 *
 * @param value - The raw data maximum to round up.
 * @returns A nice ceiling `>= value`, or `0` when `value` is not a positive finite number.
 * @example
 * niceCeil(487321); // 500000
 * niceCeil(1300);   // 2000
 * niceCeil(95);     // 100
 */
const NICE_FRACTIONS = [1, 2, 2.5, 5, 10] as const;

export const niceCeil = (value: number): number => {
  if (!Number.isFinite(value) || value <= 0) return 0;
  const exponent = Math.floor(Math.log10(value));
  const magnitude = 10 ** exponent;
  const fraction = value / magnitude;
  const niceFraction =
    NICE_FRACTIONS.find((candidate) => {
      return fraction <= candidate;
    }) ?? 10;
  return niceFraction * magnitude;
};

/**
 * Rounds a positive value DOWN to a "nice" cartographic number — the largest
 * value of the form `{1, 2, 2.5, 5, 10} × 10ⁿ` that is `<= value`. The floor
 * counterpart of {@link niceCeil}: used for legend reference values that must
 * stay at or below the data they describe (e.g. a `≥ 500` row derived from a
 * data maximum of 523), so a reference never advertises a value no datum
 * reaches.
 *
 * Returns `0` for non-positive or non-finite inputs.
 *
 * @param value - The raw value to round down.
 * @returns A nice floor `<= value`, or `0` when `value` is not a positive finite number.
 * @example
 * niceFloor(523);    // 500
 * niceFloor(261.5);  // 250
 * niceFloor(130.75); // 100
 */
export const niceFloor = (value: number): number => {
  if (!Number.isFinite(value) || value <= 0) return 0;
  const exponent = Math.floor(Math.log10(value));
  const magnitude = 10 ** exponent;
  const fraction = value / magnitude;
  const niceFraction = [...NICE_FRACTIONS].reverse().find((candidate) => {
    return candidate <= fraction;
  });
  // `fraction` is always in [1, 10), so candidate `1` always matches.
  return (niceFraction ?? 1) * magnitude;
};

export const pickPaletteColors = (
  palette: readonly string[],
  count: number
): string[] => {
  if (count <= 0) return [];
  if (count <= palette.length) {
    const step = palette.length / count;
    return Array.from({ length: count }, (_, i) => {
      return palette[Math.floor(i * step)];
    });
  }
  const step = (palette.length - 1) / (count - 1);
  return Array.from({ length: count }, (_, i) => {
    return palette[Math.round(i * step)];
  });
};
