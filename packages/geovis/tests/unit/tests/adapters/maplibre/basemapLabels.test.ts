import type maplibregl from 'maplibre-gl';
import { applyBasemapLabelsVisibility } from 'src/adapters/maplibre/basemapLabels';
import type { VisualizationSpec } from 'src/spec/types';

/**
 * Builds a minimal spec. `basemap.labels` and the user `layers` are the only
 * inputs `applyBasemapLabelsVisibility` reads.
 */
const makeSpec = (
  labels: boolean | undefined,
  layerIds: string[] = []
): VisualizationSpec => {
  return {
    engine: 'maplibre',
    basemap: labels === undefined ? {} : { labels },
    sources: [],
    layers: layerIds.map((id) => {
      return {
        id,
        sourceId: 'src',
        geometry: 'polygon',
      };
    }),
  } as unknown as VisualizationSpec;
};

type StyleLayer = { id: string; type: string };

/**
 * Mock map whose style-loaded state and layer list are controllable. `once`
 * captures the registered `idle` listener so tests can fire it manually.
 */
const makeMapMock = (opts: { styleLoaded: boolean; layers: StyleLayer[] }) => {
  let styleLoaded = opts.styleLoaded;
  const idleListeners: Array<() => void> = [];

  const map = {
    isStyleLoaded: jest.fn(() => {
      return styleLoaded;
    }),
    getStyle: jest.fn(() => {
      return { layers: opts.layers };
    }),
    setLayoutProperty: jest.fn(),
    once: jest.fn((event: string, cb: () => void) => {
      if (event === 'idle') {
        idleListeners.push(cb);
      }
    }),
  };

  return {
    map: map as unknown as maplibregl.Map,
    /** Simulates the style finishing loading, then firing `idle`. */
    fireIdle: () => {
      styleLoaded = true;
      // `once` semantics: each listener fires a single time.
      const listeners = idleListeners.splice(0, idleListeners.length);
      for (const listener of listeners) {
        listener();
      }
    },
    idleCount: () => {
      return idleListeners.length;
    },
  };
};

describe('applyBasemapLabelsVisibility', () => {
  describe('labels === false (hide)', () => {
    test('hides every symbol layer when the style is loaded', () => {
      const { map } = makeMapMock({
        styleLoaded: true,
        layers: [
          { id: 'water', type: 'fill' },
          { id: 'place-labels', type: 'symbol' },
          { id: 'road-labels', type: 'symbol' },
        ],
      });

      applyBasemapLabelsVisibility(map, makeSpec(false));

      const calls = jest.mocked(map.setLayoutProperty).mock.calls;
      expect(calls).toEqual([
        ['place-labels', 'visibility', 'none'],
        ['road-labels', 'visibility', 'none'],
      ]);
    });
  });

  describe('labels === true (restore)', () => {
    test('restores basemap symbol layers but leaves managed user layers alone', () => {
      const { map } = makeMapMock({
        styleLoaded: true,
        layers: [
          { id: 'place-labels', type: 'symbol' },
          // A user layer and one of its generated companions are "managed".
          { id: 'cities', type: 'symbol' },
          { id: 'cities-click-anchor', type: 'symbol' },
        ],
      });

      applyBasemapLabelsVisibility(map, makeSpec(true, ['cities']));

      const calls = jest.mocked(map.setLayoutProperty).mock.calls;
      // Only the basemap label layer is restored; managed layers are untouched.
      expect(calls).toEqual([['place-labels', 'visibility', 'visible']]);
    });
  });

  describe('labels === undefined (no-op)', () => {
    test('touches nothing and registers no idle listener', () => {
      const { map, idleCount } = makeMapMock({
        styleLoaded: false,
        layers: [{ id: 'place-labels', type: 'symbol' }],
      });

      applyBasemapLabelsVisibility(map, makeSpec(undefined));

      expect(map.setLayoutProperty).not.toHaveBeenCalled();
      expect(map.once).not.toHaveBeenCalled();
      expect(idleCount()).toBe(0);
    });
  });

  describe('style still loading — reschedule on idle (the mount-time bug)', () => {
    test('defers to idle instead of silently bailing, then applies once settled', () => {
      const { map, fireIdle, idleCount } = makeMapMock({
        styleLoaded: false,
        layers: [{ id: 'place-labels', type: 'symbol' }],
      });

      applyBasemapLabelsVisibility(map, makeSpec(false));

      // Nothing applied yet, but a one-shot idle listener is registered.
      expect(map.setLayoutProperty).not.toHaveBeenCalled();
      expect(map.once).toHaveBeenCalledWith('idle', expect.any(Function));
      expect(idleCount()).toBe(1);

      // Sources finish loading -> idle fires -> labels finally hidden.
      fireIdle();

      expect(jest.mocked(map.setLayoutProperty).mock.calls).toEqual([
        ['place-labels', 'visibility', 'none'],
      ]);
    });

    test('does not loop or re-register once the style is loaded', () => {
      const { map, fireIdle } = makeMapMock({
        styleLoaded: false,
        layers: [{ id: 'place-labels', type: 'symbol' }],
      });

      applyBasemapLabelsVisibility(map, makeSpec(false));
      fireIdle();

      // The re-entrant call took the normal path: applied once, registered no
      // further idle listeners (single `once` call total).
      expect(map.once).toHaveBeenCalledTimes(1);
      expect(map.setLayoutProperty).toHaveBeenCalledTimes(1);
    });
  });
});
