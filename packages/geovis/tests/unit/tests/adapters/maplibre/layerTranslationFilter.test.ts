import { toMaplibreLayer } from 'src/adapters/maplibre/layerTranslation';
import type { VisualizationLayer } from 'src/spec/types';

describe('toMaplibreLayer — filter (PRD-002 set-filter)', () => {
  test('a layer with no filter has no filter field on the translated layer', () => {
    const layer: VisualizationLayer = {
      id: 'regions',
      sourceId: 'geo',
      geometry: 'polygon',
    };
    const mapLayer = toMaplibreLayer(layer);
    expect((mapLayer as { filter?: unknown }).filter).toBeUndefined();
  });

  test('a declared filter compiles to the matching MapLibre expression', () => {
    const layer: VisualizationLayer = {
      id: 'regions',
      sourceId: 'geo',
      geometry: 'polygon',
      filter: { property: 'status', operator: 'eq', value: 'active' },
    };
    const mapLayer = toMaplibreLayer(layer);
    expect((mapLayer as { filter?: unknown }).filter).toEqual([
      '==',
      ['get', 'status'],
      'active',
    ]);
  });
});
