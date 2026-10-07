/**
 * Every `paint` key a geometry accepts (`PAINT_KEYS`) reaches the MapLibre
 * layer the adapter builds. Validation accepts exactly these keys, so a key
 * here that the builder forgets is dropped silently at render time — which is
 * how `circleStrokeOpacity` went missing (#1298).
 */

import { toMaplibreLayer } from 'src/adapters/maplibre/layerTranslation';
import { PAINT_KEYS } from 'src/spec/paintKeys';
import type { GeoVisGeometryType, VisualizationLayer } from 'src/spec/types';

const GEOMETRIES = Object.keys(PAINT_KEYS) as GeoVisGeometryType[];

test.each(GEOMETRIES)(
  'every %s paint key reaches the MapLibre layer',
  (geometry) => {
    // A value per key that cannot occur by default, so finding it in the output
    // proves that key, and no other, carried it there.
    const paint = Object.fromEntries(
      PAINT_KEYS[geometry].map((key) => {
        return [key, `sentinel-${key}`];
      })
    );
    const layer = {
      id: 'layer',
      sourceId: 'source',
      geometry,
      paint,
    } as unknown as VisualizationLayer;

    const built = JSON.stringify(toMaplibreLayer(layer));

    const dropped = PAINT_KEYS[geometry].filter((key) => {
      return !built.includes(`sentinel-${key}`);
    });
    expect(dropped).toEqual([]);
  }
);

test('a point layer without circleStrokeOpacity keeps an opaque stroke', () => {
  const layer = toMaplibreLayer({
    id: 'pts',
    sourceId: 'source',
    geometry: 'point',
  }) as { paint: Record<string, unknown> };

  expect(layer.paint['circle-stroke-opacity']).toBe(1);
});
