import type { MapData, VisualizationLayer, VisualizationSpec } from '../types';

const DOT_DENSITY_PAINT = {
  circleColor: '#E4572E',
  circleRadius: 2.4,
  circleStrokeColor: '#FAF9F7',
  circleStrokeWidth: 0.5,
};

/**
 * Resolves a dotDensity mapType spec by auto-generating:
 * - A point layer with geometry: 'point'
 * - Fixed paint defaults for density visualization
 */
export const resolveDotDensity = (
  spec: Extract<VisualizationSpec, { mapType: 'dotDensity' }>,
  sourceId: string,
  mapDataEntry: MapData
): {
  layers: VisualizationLayer[];
  legends: [];
} => {
  const pointLayer: VisualizationLayer = {
    id: `${sourceId}-dots`,
    sourceId,
    geometry: 'point',
    mapDataId: mapDataEntry.mapDataId,
    paint: DOT_DENSITY_PAINT,
  };

  return {
    layers: [pointLayer],
    legends: [],
  };
};
