/**
 * Tests the crossfade-aware source handling in `syncSourcesAndLayers`: when a
 * point layer declares a `crossfade` transition and its geojson data reference
 * changes, the source's `setData` must be **deferred** so the old data stays
 * rendered (and fades out) while the crossfade owns the swap. Sources without a
 * crossfade update immediately, as before.
 */

import { syncSourcesAndLayers } from 'src/adapters/maplibre/syncSourcesAndLayers';
import type { VisualizationSpec } from 'src/spec/types';

const makeMap = () => {
  const layers = new Set<string>();
  const sources = new Set<string>();
  const setData = jest.fn();

  const map = {
    addSource: jest.fn((id: string) => {
      sources.add(id);
    }),
    getSource: jest.fn((id: string) => {
      return sources.has(id) ? { id, setData } : null;
    }),
    removeSource: jest.fn((id: string) => {
      sources.delete(id);
    }),
    addLayer: jest.fn((layer: { id: string }) => {
      layers.add(layer.id);
    }),
    getLayer: jest.fn((id: string) => {
      return layers.has(id) ? { id } : undefined;
    }),
    removeLayer: jest.fn((id: string) => {
      layers.delete(id);
    }),
    moveLayer: jest.fn(),
    getStyle: jest.fn(() => {
      return {
        layers: [...layers].map((id) => {
          return { id };
        }),
      };
    }),
    isSourceLoaded: jest.fn(() => {
      return true;
    }),
    setLayoutProperty: jest.fn(),
    setPaintProperty: jest.fn(),
    setFilter: jest.fn(),
  };

  return { map, setData };
};

const asMap = (
  map: ReturnType<typeof makeMap>['map']
): Parameters<typeof syncSourcesAndLayers>[0] => {
  return map as unknown as Parameters<typeof syncSourcesAndLayers>[0];
};

type GeoJSONData = Extract<
  VisualizationSpec['sources'][number],
  { type: 'geojson' }
>['data'];

const dataA: GeoJSONData = { type: 'FeatureCollection', features: [] };
const dataB: GeoJSONData = { type: 'FeatureCollection', features: [] };

const buildSpec = (data: GeoJSONData, withTransition: boolean) => {
  return {
    engine: 'maplibre',
    view: { center: [0, 0], zoom: 1 },
    sources: [{ id: 'pts-src', type: 'geojson', data }],
    layers: [
      {
        id: 'pts',
        sourceId: 'pts-src',
        geometry: 'point',
        paint: { circleOpacity: 0.8 },
        ...(withTransition
          ? { transition: { kind: 'crossfade', durationMs: 400 } }
          : {}),
      } as VisualizationSpec['layers'][number],
    ],
  } as VisualizationSpec;
};

describe('syncSourcesAndLayers — crossfade defers source setData', () => {
  // The crossfade schedules real animation frames via the default scheduler.
  // Neutralize them: the deferral and shadow creation are synchronous (they run
  // before the first frame is scheduled), so no frame needs to fire, and a live
  // rAF would otherwise leak past the test.
  let originalRaf: typeof globalThis.requestAnimationFrame;
  let originalCaf: typeof globalThis.cancelAnimationFrame;

  beforeEach(() => {
    originalRaf = globalThis.requestAnimationFrame;
    originalCaf = globalThis.cancelAnimationFrame;
    globalThis.requestAnimationFrame = (() => {
      return 0;
    }) as unknown as typeof globalThis.requestAnimationFrame;
    globalThis.cancelAnimationFrame = (() => {
      return undefined;
    }) as unknown as typeof globalThis.cancelAnimationFrame;
  });

  afterEach(() => {
    globalThis.requestAnimationFrame = originalRaf;
    globalThis.cancelAnimationFrame = originalCaf;
  });

  test('defers setData and adds a shadow when a crossfade layer data changes', () => {
    const { map, setData } = makeMap();

    // Mount, then change the data reference.
    syncSourcesAndLayers(asMap(map), buildSpec(dataA, true), null);
    syncSourcesAndLayers(
      asMap(map),
      buildSpec(dataB, true),
      buildSpec(dataA, true)
    );

    // The crossfade owns the swap → the real source is NOT updated here.
    expect(setData).not.toHaveBeenCalled();
    // A shadow layer was created for the crossfade.
    expect(
      jest.mocked(map.addLayer).mock.calls.some(([layer]) => {
        return (layer as { id: string }).id === '__xf-pts';
      })
    ).toBe(true);
  });

  test('updates setData immediately when the layer has no crossfade', () => {
    const { map, setData } = makeMap();

    syncSourcesAndLayers(asMap(map), buildSpec(dataA, false), null);
    syncSourcesAndLayers(
      asMap(map),
      buildSpec(dataB, false),
      buildSpec(dataA, false)
    );

    expect(setData).toHaveBeenCalledWith(dataB);
  });
});
