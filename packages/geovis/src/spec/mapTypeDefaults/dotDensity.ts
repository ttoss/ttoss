import type { VisualizationLayer, VisualizationSpec } from '../types';
import { findMatchSourceId } from './utils';

const DEFAULT_DOT_DENSITY_PAINT = {
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
  spec: VisualizationSpec
): {
  layers: VisualizationLayer[];
  legends: [];
} => {
  const sourceId = findMatchSourceId(spec);
  const mapDataId = spec.mapData?.[0]?.mapDataId ?? 'unknown';

  const pointLayer: VisualizationLayer = {
    id: `${sourceId}-dots`,
    sourceId,
    geometry: 'point',
    mapDataId,
    paint: DEFAULT_DOT_DENSITY_PAINT,
  };

  return {
    layers: [pointLayer],
    legends: [],
  };
};
