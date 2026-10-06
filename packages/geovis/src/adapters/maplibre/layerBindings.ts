import type { MapData, VisualizationLayer } from '../../spec/types';
import type { LegendSpec } from '../../spec/types.legend';

/*
 * What a layer reads its values through: the `mapData` entry behind each
 * visual dimension, its feature-state key, and the active legend's threshold
 * breaks. Shared by the paint each geometry builds (`layerTranslation`).
 */

/** Resolves the mapData entry driving a given dimension of a layer, if any. */
export const resolveDimensionMapData = (
  dimension: 'color' | 'size',
  sourceId: string,
  layerMapDataId: string | undefined,
  specMapData?: MapData[]
): MapData | undefined => {
  // Prefer dataset explicitly marked with this dimension, scoped to the layer's source
  const byDimension = specMapData?.find((m) => {
    return m.dimension === dimension && m.mapId === sourceId;
  });
  if (byDimension) return byDimension;

  // Fallback: legacy layer.mapDataId (single-dimension, no dimension declared)
  if (layerMapDataId) {
    const byId = specMapData?.find((m) => {
      return m.mapDataId === layerMapDataId;
    });
    if (byId) return byId;
  }

  // Fallback: any mapData entry for this source (single-dataset scenario)
  return specMapData?.find((m) => {
    return m.mapId === sourceId;
  });
};

/**
 * Resolves the stateKey for a given dimension from the spec's mapData array:
 * the matching entry's `stateKey`, `'value'` when it omits one (default per
 * spec) or when no entry matches.
 */
export const resolveDimensionStateKey = (
  dimension: 'color' | 'size',
  sourceId: string,
  layerMapDataId: string | undefined,
  specMapData?: MapData[]
): string => {
  return (
    resolveDimensionMapData(dimension, sourceId, layerMapDataId, specMapData)
      ?.stateKey ?? 'value'
  );
};

export const resolveThresholdBreaks = (
  layer: VisualizationLayer,
  specLegends?: LegendSpec[]
): number[] => {
  const legend =
    layer.legends?.find((item) => {
      return item.id === layer.activeLegendId;
    }) ??
    specLegends?.find((item) => {
      return item.id === layer.activeLegendId;
    });
  if (!legend || !legend.colorBy || legend.colorBy.type !== 'quantitative')
    return [];
  if (legend.colorBy.scale !== 'threshold') return [];
  return Array.from(
    new Set(
      (legend.colorBy.thresholds ?? []).filter((value) => {
        return Number.isFinite(value);
      })
    )
  ).sort((a, b) => {
    return a - b;
  });
};
