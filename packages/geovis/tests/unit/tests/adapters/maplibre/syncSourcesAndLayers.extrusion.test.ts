/**
 * A polygon layer gaining or losing `extrusion` changes MapLibre type, which no
 * layer can do in place. `syncSourcesAndLayers` swaps it with the prisms rising
 * from flat, or lying down before the flat layer comes back, and eases every
 * height change in between — the swap itself waiting until the source has no
 * tile in flight. A stateful map keeps each layer's type and whether its
 * source is loading, and a manual scheduler drives the frames.
 */

import { forgetExtrusionLayer } from 'src/adapters/maplibre/extrusionLifecycle';
import {
  setExtrusionScheduler,
  transitionExtrusionHeight,
} from 'src/adapters/maplibre/extrusionTransition';
import { reapplyLegendDrivenFillPaint } from 'src/adapters/maplibre/legendFillPaint';
import {
  reapplyLayerPaint,
  syncSourcesAndLayers,
} from 'src/adapters/maplibre/syncSourcesAndLayers';
import type { PolygonExtrusion, VisualizationSpec } from 'src/spec/types';

type Layer = { id: string; type: string; paint?: Record<string, unknown> };

const makeMap = () => {
  const layers = new Map<string, Layer>();
  const sources = new Set<string>();
  const handlers = new Map<string, Set<() => void>>();
  // Whether the sources have every tile loaded; `false` stands for tiles in
  // flight, as while the camera eases.
  let loaded = true;

  const map = {
    addSource: jest.fn((id: string) => {
      sources.add(id);
    }),
    getSource: jest.fn((id: string) => {
      return sources.has(id) ? { id, setData: jest.fn() } : undefined;
    }),
    removeSource: jest.fn(),
    addLayer: jest.fn((layer: Layer) => {
      layers.set(layer.id, layer);
    }),
    getLayer: jest.fn((id: string) => {
      return layers.get(id);
    }),
    removeLayer: jest.fn((id: string) => {
      layers.delete(id);
    }),
    moveLayer: jest.fn(),
    getStyle: jest.fn(() => {
      return { layers: [...layers.values()] };
    }),
    setLayoutProperty: jest.fn(),
    setPaintProperty: jest.fn(),
    setFilter: jest.fn(),
    isSourceLoaded: jest.fn(() => {
      return loaded;
    }),
    on: jest.fn((event: string, handler: () => void) => {
      if (!handlers.has(event)) handlers.set(event, new Set());
      handlers.get(event)!.add(handler);
    }),
    off: jest.fn((event: string, handler: () => void) => {
      handlers.get(event)?.delete(handler);
    }),
  };

  /** Fires every handler of `event`, as MapLibre would. */
  const emit = (event: string) => {
    for (const handler of [...(handlers.get(event) ?? [])]) handler();
  };

  const setLoaded = (next: boolean) => {
    loaded = next;
  };

  const listenerCount = () => {
    return [...handlers.values()].reduce((sum, set) => {
      return sum + set.size;
    }, 0);
  };

  return { map, layers, sources, emit, setLoaded, listenerCount };
};

type MapArg = Parameters<typeof syncSourcesAndLayers>[0];

const makeScheduler = () => {
  let now = 0;
  let nextHandle = 1;
  const frames = new Map<number, () => void>();
  return {
    scheduler: {
      now: () => {
        return now;
      },
      raf: (cb: () => void) => {
        const handle = nextHandle++;
        frames.set(handle, cb);
        return handle;
      },
      caf: (handle: number) => {
        frames.delete(handle);
      },
    },
    advance: (ms: number) => {
      now += ms;
      const pending = [...frames.values()];
      frames.clear();
      for (const cb of pending) cb();
    },
  };
};

const buildSpec = ({
  extrusion,
  visible,
}: {
  extrusion?: PolygonExtrusion;
  visible?: boolean;
} = {}): VisualizationSpec => {
  return {
    engine: 'maplibre',
    sources: [
      {
        id: 'districts',
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      },
    ],
    layers: [
      {
        id: 'fill',
        sourceId: 'districts',
        geometry: 'polygon',
        mapDataId: 'rates',
        activeLegendId: 'rates',
        ...(visible === false && { visible }),
        ...(extrusion && { extrusion }),
      },
    ],
    legends: [
      {
        id: 'rates',
        colorBy: {
          type: 'quantitative',
          property: 'value',
          scale: 'threshold',
          thresholds: [10],
          colors: ['#eee', '#111'],
        },
      },
    ],
    mapData: [
      {
        mapDataId: 'rates',
        mapId: 'districts',
        data: [{ geometryId: 1, value: 20 }],
      },
    ],
  };
};

/** The class-mode height a two-class legend gives at `maxHeight`. */
const heightAt = (maxHeight: number) => {
  return [
    'case',
    ['!=', ['feature-state', 'value'], null],
    [
      'step',
      ['to-number', ['feature-state', 'value'], 0],
      maxHeight / 2,
      10,
      maxHeight,
    ],
    0,
  ];
};

const heightWrites = (map: ReturnType<typeof makeMap>['map']) => {
  return map.setPaintProperty.mock.calls
    .filter((call) => {
      return call[1] === 'fill-extrusion-height';
    })
    .map((call) => {
      return call[2];
    });
};

let clock: ReturnType<typeof makeScheduler>;

beforeEach(() => {
  clock = makeScheduler();
  setExtrusionScheduler(clock.scheduler);
});

afterEach(() => {
  setExtrusionScheduler();
});

test('a new extruded layer is added flat and rises to its height', () => {
  const { map, layers } = makeMap();
  const spec = buildSpec({ extrusion: { maxHeight: 1000, transitionMs: 100 } });

  syncSourcesAndLayers(map as unknown as MapArg, spec, null);

  expect(layers.get('fill')?.type).toBe('fill-extrusion');
  expect(layers.get('fill')?.paint?.['fill-extrusion-height']).toBe(0);

  clock.advance(100);
  expect(heightWrites(map).at(-1)).toEqual(heightAt(1000));
});

test('2D → 3D swaps the flat layer for prisms rising from flat', () => {
  const { map, layers } = makeMap();
  const flat = buildSpec();
  syncSourcesAndLayers(map as unknown as MapArg, flat, null);
  expect(layers.get('fill')?.type).toBe('fill');

  const extruded = buildSpec({ extrusion: { maxHeight: 1000 } });
  syncSourcesAndLayers(map as unknown as MapArg, extruded, flat);

  expect(map.removeLayer).toHaveBeenCalledWith('fill');
  expect(layers.get('fill')?.type).toBe('fill-extrusion');
  // The default transition takes 600ms.
  clock.advance(600);
  expect(heightWrites(map).at(-1)).toEqual(heightAt(1000));
});

test('a hidden layer swaps without an ease', () => {
  const { map, layers } = makeMap();
  const spec = buildSpec({ extrusion: { maxHeight: 1000 }, visible: false });

  syncSourcesAndLayers(map as unknown as MapArg, spec, null);

  expect(layers.get('fill')?.paint?.['fill-extrusion-height']).toEqual(
    heightAt(1000)
  );
});

test('3D → 2D lays the prisms down, then swaps the flat layer back in', () => {
  const { map, layers } = makeMap();
  const extruded = buildSpec({
    extrusion: { maxHeight: 1000, transitionMs: 0 },
  });
  syncSourcesAndLayers(map as unknown as MapArg, extruded, null);

  const flat = buildSpec();
  syncSourcesAndLayers(map as unknown as MapArg, flat, extruded);

  // The flat layer no longer declares a duration; the one it last rose with
  // (0) carries over, so the prisms lie down and the swap lands at once.
  expect(layers.get('fill')?.type).toBe('fill');
  expect(heightWrites(map).at(-1)).toBe(0);
});

test('3D → 2D with an ease keeps the prisms until they are flat', () => {
  const { map, layers } = makeMap();
  const extruded = buildSpec({
    extrusion: { maxHeight: 1000, transitionMs: 100 },
  });
  syncSourcesAndLayers(map as unknown as MapArg, extruded, null);
  clock.advance(100);

  const flat = buildSpec();
  syncSourcesAndLayers(map as unknown as MapArg, flat, extruded);
  expect(layers.get('fill')?.type).toBe('fill-extrusion');

  // An update mid-collapse only refreshes the flat layer waiting to come in,
  // and a legend re-apply leaves the mismatched layer alone.
  syncSourcesAndLayers(map as unknown as MapArg, flat, flat);
  reapplyLegendDrivenFillPaint(map as unknown as MapArg, flat);
  reapplyLayerPaint(map as unknown as MapArg, flat, flat.layers[0]);
  expect(layers.get('fill')?.type).toBe('fill-extrusion');

  clock.advance(100);
  expect(layers.get('fill')?.type).toBe('fill');
});

test('back to 3D mid-collapse calls the swap off', () => {
  const { map, layers } = makeMap();
  const extruded = buildSpec({
    extrusion: { maxHeight: 1000, transitionMs: 100 },
  });
  syncSourcesAndLayers(map as unknown as MapArg, extruded, null);
  clock.advance(100);
  const flat = buildSpec();
  syncSourcesAndLayers(map as unknown as MapArg, flat, extruded);
  clock.advance(50);

  syncSourcesAndLayers(map as unknown as MapArg, extruded, flat);
  clock.advance(200);

  expect(layers.get('fill')?.type).toBe('fill-extrusion');
  expect(heightWrites(map).at(-1)).toEqual(heightAt(1000));
});

test('hiding a collapsing layer swaps it at once', () => {
  const { map, layers } = makeMap();
  const extruded = buildSpec({
    extrusion: { maxHeight: 1000, transitionMs: 100 },
  });
  syncSourcesAndLayers(map as unknown as MapArg, extruded, null);

  const hiddenFlat = buildSpec({ visible: false });
  syncSourcesAndLayers(map as unknown as MapArg, hiddenFlat, extruded);

  expect(layers.get('fill')?.type).toBe('fill');
});

test('a new maxHeight eases the prisms to it', () => {
  const { map } = makeMap();
  const low = buildSpec({ extrusion: { maxHeight: 1000, transitionMs: 100 } });
  syncSourcesAndLayers(map as unknown as MapArg, low, null);
  clock.advance(100);

  const high = buildSpec({
    extrusion: { maxHeight: 3000, transitionMs: 100 },
  });
  syncSourcesAndLayers(map as unknown as MapArg, high, low);
  clock.advance(50);
  expect(heightWrites(map).at(-1)).toEqual([
    '+',
    ['*', 0.5, heightAt(1000)],
    ['*', 0.5, heightAt(3000)],
  ]);

  clock.advance(50);
  expect(heightWrites(map).at(-1)).toEqual(heightAt(3000));
});

test('the legend re-apply eases the height and writes the extrusion color', () => {
  const { map } = makeMap();
  const low = buildSpec({ extrusion: { maxHeight: 1000, transitionMs: 100 } });
  syncSourcesAndLayers(map as unknown as MapArg, low, null);
  clock.advance(100);

  const hidden = buildSpec({
    extrusion: { maxHeight: 2000 },
    visible: false,
  });
  reapplyLegendDrivenFillPaint(map as unknown as MapArg, hidden);

  expect(heightWrites(map).at(-1)).toEqual(heightAt(2000));
  expect(map.setPaintProperty).toHaveBeenCalledWith(
    'fill',
    'fill-extrusion-color',
    expect.any(Array)
  );
});

test('the legend re-apply on a visible layer eases to the new height', () => {
  const { map } = makeMap();
  const low = buildSpec({ extrusion: { maxHeight: 1000, transitionMs: 100 } });
  syncSourcesAndLayers(map as unknown as MapArg, low, null);
  clock.advance(100);

  reapplyLegendDrivenFillPaint(
    map as unknown as MapArg,
    buildSpec({ extrusion: { maxHeight: 2000, transitionMs: 100 } })
  );
  clock.advance(50);
  expect(heightWrites(map).at(-1)).toEqual([
    '+',
    ['*', 0.5, heightAt(1000)],
    ['*', 0.5, heightAt(2000)],
  ]);
});

test('removing an extruded layer drops its state', () => {
  const { map, layers } = makeMap();
  const extruded = buildSpec({
    extrusion: { maxHeight: 1000, transitionMs: 100 },
  });
  syncSourcesAndLayers(map as unknown as MapArg, extruded, null);

  const empty: VisualizationSpec = { ...extruded, layers: [] };
  syncSourcesAndLayers(map as unknown as MapArg, empty, extruded);
  clock.advance(100);

  expect(layers.has('fill')).toBe(false);
});

describe('the type swap waits for the source to settle', () => {
  test('3D → 2D keeps the flat prisms until the last tile lands', () => {
    const { map, layers, emit, setLoaded, listenerCount } = makeMap();
    const extruded = buildSpec({
      extrusion: { maxHeight: 1000, transitionMs: 100 },
    });
    syncSourcesAndLayers(map as unknown as MapArg, extruded, null);
    clock.advance(100);

    // The camera is easing back from its pitch: tiles are in flight.
    setLoaded(false);
    const flat = buildSpec();
    syncSourcesAndLayers(map as unknown as MapArg, flat, extruded);
    clock.advance(100);

    // Lain down, but not swapped: a tile built for the extruded layer may
    // still land.
    expect(heightWrites(map).at(-1)).toBe(0);
    expect(layers.get('fill')?.type).toBe('fill-extrusion');

    // A tile lands, others still in flight.
    emit('sourcedata');
    expect(layers.get('fill')?.type).toBe('fill-extrusion');

    setLoaded(true);
    emit('sourcedata');
    expect(layers.get('fill')?.type).toBe('fill');
    expect(listenerCount()).toBe(0);
  });

  test('an update while the swap waits is the flat layer swapped in', () => {
    const { map, layers, emit, setLoaded } = makeMap();
    const extruded = buildSpec({
      extrusion: { maxHeight: 1000, transitionMs: 0 },
    });
    syncSourcesAndLayers(map as unknown as MapArg, extruded, null);

    setLoaded(false);
    const flat = buildSpec();
    syncSourcesAndLayers(map as unknown as MapArg, flat, extruded);
    const hidden = buildSpec({ visible: false });
    syncSourcesAndLayers(map as unknown as MapArg, hidden, flat);
    expect(layers.get('fill')?.type).toBe('fill-extrusion');

    setLoaded(true);
    emit('idle');
    expect(layers.get('fill')?.type).toBe('fill');
    expect(map.addLayer).toHaveBeenLastCalledWith(
      expect.objectContaining({ layout: { visibility: 'none' } })
    );
  });

  test('back to 3D while the swap waits calls it off', () => {
    const { map, layers, emit, setLoaded, listenerCount } = makeMap();
    const extruded = buildSpec({
      extrusion: { maxHeight: 1000, transitionMs: 0 },
    });
    syncSourcesAndLayers(map as unknown as MapArg, extruded, null);

    setLoaded(false);
    const flat = buildSpec();
    syncSourcesAndLayers(map as unknown as MapArg, flat, extruded);
    syncSourcesAndLayers(map as unknown as MapArg, extruded, flat);
    expect(listenerCount()).toBe(0);

    setLoaded(true);
    emit('sourcedata');
    expect(layers.get('fill')?.type).toBe('fill-extrusion');
  });

  test('2D → 3D keeps the flat layer until the source settles, then rises', () => {
    const { map, layers, emit, setLoaded } = makeMap();
    const flat = buildSpec();
    syncSourcesAndLayers(map as unknown as MapArg, flat, null);

    setLoaded(false);
    const extruded = buildSpec({
      extrusion: { maxHeight: 1000, transitionMs: 100 },
    });
    syncSourcesAndLayers(map as unknown as MapArg, extruded, flat);
    expect(layers.get('fill')?.type).toBe('fill');
    expect(map.removeLayer).not.toHaveBeenCalled();

    setLoaded(true);
    emit('sourcedata');
    expect(layers.get('fill')?.type).toBe('fill-extrusion');
    expect(layers.get('fill')?.paint?.['fill-extrusion-height']).toBe(0);
    clock.advance(100);
    expect(heightWrites(map).at(-1)).toEqual(heightAt(1000));
  });

  test('flat again before the rise swaps in leaves the flat layer alone', () => {
    const { map, layers, emit, setLoaded, listenerCount } = makeMap();
    const flat = buildSpec();
    syncSourcesAndLayers(map as unknown as MapArg, flat, null);

    setLoaded(false);
    const extruded = buildSpec({ extrusion: { maxHeight: 1000 } });
    syncSourcesAndLayers(map as unknown as MapArg, extruded, flat);
    syncSourcesAndLayers(map as unknown as MapArg, flat, extruded);
    expect(listenerCount()).toBe(0);

    setLoaded(true);
    emit('sourcedata');
    expect(layers.get('fill')?.type).toBe('fill');
  });

  test('a source removed meanwhile counts as settled', () => {
    const { map, layers, sources, emit, setLoaded } = makeMap();
    const flat = buildSpec();
    syncSourcesAndLayers(map as unknown as MapArg, flat, null);

    setLoaded(false);
    syncSourcesAndLayers(
      map as unknown as MapArg,
      buildSpec({ extrusion: { maxHeight: 1000 } }),
      flat
    );
    sources.clear();
    emit('idle');

    expect(layers.get('fill')?.type).toBe('fill-extrusion');
  });

  test('forgetting the layer drops a waiting swap', () => {
    const { map, layers, emit, setLoaded, listenerCount } = makeMap();
    const flat = buildSpec();
    syncSourcesAndLayers(map as unknown as MapArg, flat, null);

    setLoaded(false);
    syncSourcesAndLayers(
      map as unknown as MapArg,
      buildSpec({ extrusion: { maxHeight: 1000 } }),
      flat
    );
    forgetExtrusionLayer(map as unknown as MapArg, 'fill');
    expect(listenerCount()).toBe(0);

    setLoaded(true);
    emit('sourcedata');
    expect(layers.get('fill')?.type).toBe('fill');
  });
});

test('no height is written to a layer that is no longer extruded', () => {
  const { map } = makeMap();
  syncSourcesAndLayers(map as unknown as MapArg, buildSpec(), null);

  transitionExtrusionHeight({
    map: map as unknown as MapArg,
    layerId: 'fill',
    to: 1000,
    durationMs: 0,
  });

  expect(heightWrites(map)).toEqual([]);
});
