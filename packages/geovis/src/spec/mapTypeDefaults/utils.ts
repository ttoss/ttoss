import type { MapDataRow } from '../types';
import { jenksBuckets } from './jenks';

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
