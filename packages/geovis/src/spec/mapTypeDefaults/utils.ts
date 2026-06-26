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
