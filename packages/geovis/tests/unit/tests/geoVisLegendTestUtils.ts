import type { VisualizationSpec } from 'src/spec/types';

/**
 * Minimal spec the legend suites build on: one GeoJSON source and one polygon
 * layer, with no legend configured. Each test layers its own legend config on
 * top.
 */
export const baseSpec: VisualizationSpec = {
  engine: 'maplibre',
  view: { center: [0, 0], zoom: 1 },
  sources: [
    {
      id: 'states',
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    },
  ],
  layers: [{ id: 'fill', sourceId: 'states', geometry: 'polygon' }],
};
