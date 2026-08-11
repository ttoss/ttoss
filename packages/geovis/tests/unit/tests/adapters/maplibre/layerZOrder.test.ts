/**
 * Regression tests for issue #1129 — the MapLibre adapter must reconcile the
 * on-map paint order to `spec.layers` order on every sync, not leave it a
 * function of insertion history.
 *
 * These drive `syncSourcesAndLayers` / `enforceManagedLayerOrder` /
 * `applyLayerPatch` with a **stateful** mock map that tracks a real ordered
 * list of layer ids (bottom → top), so assertions read the rendered order the
 * way MapLibre would expose it via `getStyle().layers`.
 */

import { applyLayerPatch } from 'src/adapters/maplibre/patchDispatch';
import {
  enforceManagedLayerOrder,
  syncSourcesAndLayers,
} from 'src/adapters/maplibre/syncSourcesAndLayers';
import type { VisualizationSpec } from 'src/spec/types';

// ---------------------------------------------------------------------------
// Stateful mock map — tracks layer order bottom → top (last === top).
// ---------------------------------------------------------------------------

const makeStatefulMap = () => {
  const order: string[] = [];
  const layers = new Set<string>();
  const sources = new Set<string>();

  const map = {
    addSource: jest.fn((id: string) => {
      sources.add(id);
    }),
    getSource: jest.fn((id: string) => {
      return sources.has(id) ? { setData: jest.fn() } : null;
    }),
    removeSource: jest.fn((id: string) => {
      sources.delete(id);
    }),
    addLayer: jest.fn((layer: { id: string }) => {
      if (layers.has(layer.id)) return;
      layers.add(layer.id);
      order.push(layer.id);
    }),
    getLayer: jest.fn((id: string) => {
      return layers.has(id) ? { id } : undefined;
    }),
    removeLayer: jest.fn((id: string) => {
      layers.delete(id);
      const index = order.indexOf(id);
      if (index !== -1) order.splice(index, 1);
    }),
    moveLayer: jest.fn((id: string, beforeId?: string) => {
      const from = order.indexOf(id);
      if (from !== -1) order.splice(from, 1);
      if (beforeId === undefined) {
        order.push(id);
        return;
      }
      const to = order.indexOf(beforeId);
      order.splice(to === -1 ? order.length : to, 0, id);
    }),
    getStyle: jest.fn(() => {
      return {
        layers: order.map((id) => {
          return { id };
        }),
      };
    }),
    setLayoutProperty: jest.fn(),
    setPaintProperty: jest.fn(),
    setFilter: jest.fn(),
  };

  return { map, order };
};

type StatefulMap = ReturnType<typeof makeStatefulMap>['map'];

const asMap = (
  map: StatefulMap
): Parameters<typeof syncSourcesAndLayers>[0] => {
  return map as unknown as Parameters<typeof syncSourcesAndLayers>[0];
};

// ---------------------------------------------------------------------------
// Spec builders
// ---------------------------------------------------------------------------

type Layer = VisualizationSpec['layers'][number];

const layer = (id: string, extra: Partial<Layer> = {}): Layer => {
  return {
    id,
    sourceId: 'src',
    geometry: 'polygon',
    ...extra,
  } as Layer;
};

const specWith = (layers: Layer[]): VisualizationSpec => {
  return {
    engine: 'maplibre',
    view: { center: [0, 0], zoom: 1 },
    sources: [
      {
        id: 'src',
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      },
    ],
    layers,
  };
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('enforceManagedLayerOrder via syncSourcesAndLayers', () => {
  test('keeps a persisting top layer on top when a lower layer is added later (issue #1129 repro)', () => {
    const { map, order } = makeStatefulMap();

    const specA = specWith([
      layer('fillA'),
      layer('points', { geometry: 'point' }),
    ]);
    syncSourcesAndLayers(asMap(map), specA, null);
    expect(order).toEqual(['fillA', 'points']);

    // Add a new layer declared BELOW the persisting `points` overlay.
    const specB = specWith([
      layer('fillA'),
      layer('fillB'),
      layer('points', { geometry: 'point' }),
    ]);
    syncSourcesAndLayers(asMap(map), specB, specA);

    // `points` is last in spec.layers, so it must stay on top despite fillB
    // being added after it.
    expect(order).toEqual(['fillA', 'fillB', 'points']);
  });

  test('reorders to match spec.layers when the declared order changes', () => {
    const { map, order } = makeStatefulMap();

    const specA = specWith([layer('a'), layer('b'), layer('c')]);
    syncSourcesAndLayers(asMap(map), specA, null);
    expect(order).toEqual(['a', 'b', 'c']);

    const specB = specWith([layer('c'), layer('a'), layer('b')]);
    syncSourcesAndLayers(asMap(map), specB, specA);
    expect(order).toEqual(['c', 'a', 'b']);
  });

  test('does not call moveLayer when the on-map order already matches (no needless repaint)', () => {
    const { map } = makeStatefulMap();
    const spec = specWith([layer('a'), layer('b'), layer('c')]);

    syncSourcesAndLayers(asMap(map), spec, null);

    expect(map.moveLayer).not.toHaveBeenCalled();
  });

  test('keeps hidden (visible:false) layers in their slot so toggling visibility never changes z-order', () => {
    const { map, order } = makeStatefulMap();

    const specA = specWith([
      layer('fillA', { visible: false }),
      layer('points', { geometry: 'point' }),
    ]);
    syncSourcesAndLayers(asMap(map), specA, null);
    expect(order).toEqual(['fillA', 'points']);

    // Add a lower layer; the hidden fillA must still hold its declared slot.
    const specB = specWith([
      layer('fillA', { visible: false }),
      layer('fillB'),
      layer('points', { geometry: 'point' }),
    ]);
    syncSourcesAndLayers(asMap(map), specB, specA);
    expect(order).toEqual(['fillA', 'fillB', 'points']);
  });

  test('keeps a companion outline adjacent to and above its parent, below higher layers', () => {
    const { map, order } = makeStatefulMap();

    const specA = specWith([
      layer('fillA', { hoverPaint: { lineColor: '#000', lineWidth: 2 } }),
      layer('points', { geometry: 'point' }),
    ]);
    syncSourcesAndLayers(asMap(map), specA, null);
    expect(order).toEqual(['fillA', 'fillA-hover-outline', 'points']);

    // Add a lower layer — companion must stay grouped with fillA, points on top.
    const specB = specWith([
      layer('fillA', { hoverPaint: { lineColor: '#000', lineWidth: 2 } }),
      layer('fillB'),
      layer('points', { geometry: 'point' }),
    ]);
    syncSourcesAndLayers(asMap(map), specB, specA);
    expect(order).toEqual(['fillA', 'fillA-hover-outline', 'fillB', 'points']);
  });

  test('never moves basemap / non-managed layers', () => {
    const { map, order } = makeStatefulMap();
    // A non-managed basemap layer sitting at the bottom before any sync.
    map.addLayer({ id: 'basemap-bg' });

    const specA = specWith([
      layer('fillA'),
      layer('points', { geometry: 'point' }),
    ]);
    syncSourcesAndLayers(asMap(map), specA, null);

    const specB = specWith([
      layer('fillA'),
      layer('fillB'),
      layer('points', { geometry: 'point' }),
    ]);
    syncSourcesAndLayers(asMap(map), specB, specA);

    // Basemap stays at the very bottom; managed layers ordered above it.
    expect(order).toEqual(['basemap-bg', 'fillA', 'fillB', 'points']);
  });
});

describe('enforceManagedLayerOrder — direct', () => {
  test('is a no-op when fewer than two managed layers are on the map', () => {
    const { map } = makeStatefulMap();
    map.addLayer({ id: 'only' });

    enforceManagedLayerOrder(asMap(map), specWith([layer('only')]));

    expect(map.moveLayer).not.toHaveBeenCalled();
  });

  test('skips layers not present on the map', () => {
    const { map, order } = makeStatefulMap();
    map.addLayer({ id: 'a' });
    map.addLayer({ id: 'c' });

    // `b` is declared between a and c but is not on the map.
    enforceManagedLayerOrder(
      asMap(map),
      specWith([layer('a'), layer('b'), layer('c')])
    );

    expect(order).toEqual(['a', 'c']);
  });
});

describe('applyLayerPatch add — enforces order', () => {
  test('reconciles order after a patch-added layer, keeping the declared top layer on top', () => {
    const { map, order } = makeStatefulMap();

    const spec = specWith([
      layer('fillA'),
      layer('points', { geometry: 'point' }),
    ]);
    syncSourcesAndLayers(asMap(map), spec, null);
    expect(order).toEqual(['fillA', 'points']);

    const viewState = { spec };
    applyLayerPatch(asMap(map), viewState, {
      target: 'layer',
      op: 'add',
      path: 'layer.fillB',
      value: layer('fillB'),
    } as Parameters<typeof applyLayerPatch>[2]);

    // The patch appends fillB to spec.layers (top), so it lands above points —
    // but the pass still guarantees order === spec.layers order.
    expect(order).toEqual(['fillA', 'points', 'fillB']);
    expect(
      viewState.spec.layers.map((l) => {
        return l.id;
      })
    ).toEqual(['fillA', 'points', 'fillB']);
  });
});
