import type maplibregl from 'maplibre-gl';

import type { VisualizationSpec } from '../../spec/types';
import { resolveLegendFillColorExpression } from './layerTranslation';

/**
 * Applies a paint property immediately when the map's style is loaded,
 * otherwise defers the assignment to the next `style.load` event. Centralised
 * here so all legend-driven paint mutations share one race-free entry point.
 */
export const setPaintWhenReady = (
  map: maplibregl.Map,
  layerId: string,
  property: string,
  value: unknown
): void => {
  const apply = () => {
    if (!map.getLayer(layerId)) return;
    map.setPaintProperty(
      layerId,
      property,
      value as maplibregl.StyleSpecification
    );
  };
  if (map.isStyleLoaded()) apply();
  else map.once('style.load', apply);
};

/** Re-applies legend-driven polygon fill expressions for layers with active legends. */
export const reapplyLegendDrivenFillPaint = (
  map: maplibregl.Map,
  spec: VisualizationSpec
): void => {
  for (const layer of spec.layers) {
    if (layer.geometry !== 'polygon') continue;
    const expression = resolveLegendFillColorExpression(layer, spec.legends);
    if (!expression) continue;
    setPaintWhenReady(map, layer.id, 'fill-color', expression);
  }
};
