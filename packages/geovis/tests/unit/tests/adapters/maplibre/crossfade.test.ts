/**
 * Unit tests for the opt-in crossfade transition (`crossfade.ts`).
 *
 * A stateful mock map tracks which sources/layers "exist" so the guards in
 * `startCrossfade`/`runCrossfades` behave realistically, and an injected manual
 * scheduler drives animation frames deterministically (no real rAF).
 *
 * The crossfade fades the already-rendered real layer (OLD data) OUT while a
 * shadow layer holding the NEW data fades IN, then commits the NEW data to the
 * real source once it has parsed. Tests assert that role split.
 */

import {
  type CrossfadeScheduler,
  resolveEasing,
  runCrossfades,
  startCrossfade,
} from 'src/adapters/maplibre/crossfade';
import type { VisualizationSpec } from 'src/spec/types';

// ---------------------------------------------------------------------------
// Stateful mock map
// ---------------------------------------------------------------------------

const makeMapMock = ({ sourceLoaded = true } = {}) => {
  const layers = new Set<string>();
  const sources = new Set<string>();
  // The real point layer + source are assumed already mounted by upsert passes.
  layers.add('stores');
  sources.add('stores-src');
  const setData = jest.fn();

  const map = {
    addSource: jest.fn((id: string) => {
      sources.add(id);
    }),
    addLayer: jest.fn((spec: { id: string }) => {
      layers.add(spec.id);
    }),
    removeLayer: jest.fn((id: string) => {
      layers.delete(id);
    }),
    removeSource: jest.fn((id: string) => {
      sources.delete(id);
    }),
    getLayer: jest.fn((id: string) => {
      return layers.has(id) ? { id } : undefined;
    }),
    getSource: jest.fn((id: string) => {
      return sources.has(id) ? { id, setData } : undefined;
    }),
    isSourceLoaded: jest.fn((id: string) => {
      // The freshly-added shadow source parses instantly in tests; only the
      // real source's parse timing is exercised via `sourceLoaded`, so the
      // shadow-ready gate never blocks the fade from starting.
      return id.startsWith('__xf-src-') ? true : sourceLoaded;
    }),
    setPaintProperty: jest.fn(),
    setFeatureState: jest.fn(),
  };
  return { map, layers, sources, setData };
};

type MapMock = ReturnType<typeof makeMapMock>['map'];

// ---------------------------------------------------------------------------
// Manual scheduler
// ---------------------------------------------------------------------------

const makeScheduler = () => {
  let time = 0;
  const queue: Array<(t: number) => void> = [];
  const scheduler: CrossfadeScheduler = {
    now: () => {
      return time;
    },
    raf: (cb) => {
      queue.push(cb);
      return queue.length; // 1-based handle
    },
    caf: (handle) => {
      queue[handle - 1] = () => {
        return undefined;
      };
    },
  };
  const advance = (ms: number) => {
    time += ms;
    const pending = queue.splice(0, queue.length);
    for (const cb of pending) cb(time);
  };
  return { scheduler, advance };
};

// ---------------------------------------------------------------------------
// Spec builder
// ---------------------------------------------------------------------------

type GeoJSONData = Extract<
  VisualizationSpec['sources'][number],
  { type: 'geojson' }
>['data'];

const dataA: GeoJSONData = { type: 'FeatureCollection', features: [] };
const dataB: GeoJSONData = { type: 'FeatureCollection', features: [] };

const buildSpec = (
  data: GeoJSONData,
  withTransition = true
): VisualizationSpec => {
  return {
    engine: 'maplibre',
    view: { center: [0, 0], zoom: 1 },
    sources: [
      {
        id: 'stores-src',
        type: 'geojson',
        data,
      },
    ],
    layers: [
      {
        id: 'stores',
        sourceId: 'stores-src',
        geometry: 'point',
        paint: { circleOpacity: 0.8 },
        ...(withTransition
          ? { transition: { kind: 'crossfade', durationMs: 400 } }
          : {}),
      } as VisualizationSpec['layers'][number],
    ],
  };
};

/** A spec whose point layer is coloured by a `mapData` feature-state join. */
const buildSpecWithMapData = (data: GeoJSONData): VisualizationSpec => {
  const spec = buildSpec(data);
  return {
    ...spec,
    mapData: [
      {
        mapDataId: 'stores-status',
        mapId: 'stores-src',
        joinKey: 'code',
        data: [{ geometryId: 'k1', value: 'open' }],
      },
    ],
  };
};

const lastPaintValue = (
  map: MapMock,
  layerId: string,
  property: string
): unknown => {
  const calls = jest.mocked(map.setPaintProperty).mock.calls as Array<
    [string, string, unknown]
  >;
  const match = [...calls].reverse().find(([id, prop]) => {
    return id === layerId && prop === property;
  });
  return match?.[2];
};

// ---------------------------------------------------------------------------
// resolveEasing
// ---------------------------------------------------------------------------

describe('resolveEasing', () => {
  test('linear is identity', () => {
    const e = resolveEasing('linear');
    expect(e(0)).toBe(0);
    expect(e(0.5)).toBe(0.5);
    expect(e(1)).toBe(1);
  });

  test('ease-out', () => {
    const e = resolveEasing('ease-out');
    expect(e(0)).toBe(0);
    expect(e(0.5)).toBe(0.75);
    expect(e(1)).toBe(1);
  });

  test('ease-in-out', () => {
    const e = resolveEasing('ease-in-out');
    expect(e(0)).toBe(0);
    expect(e(0.5)).toBe(0.5);
    expect(e(1)).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// runCrossfades — happy path
// ---------------------------------------------------------------------------

describe('runCrossfades — crossfade point layer with changed data', () => {
  test('shadow holds NEW data, real fades out from base, then commits + restores', () => {
    const { map, setData } = makeMapMock();
    const { scheduler, advance } = makeScheduler();

    runCrossfades(
      map as unknown as Parameters<typeof runCrossfades>[0],
      buildSpec(dataB),
      buildSpec(dataA),
      scheduler
    );

    // Shadow source created with the NEW data (dataB) — it fades in.
    expect(map.addSource).toHaveBeenCalledWith('__xf-src-stores', {
      type: 'geojson',
      data: dataB,
    });
    // Shadow layer created with reserved id + shadow source.
    const shadowAddCall = jest
      .mocked(map.addLayer)
      .mock.calls.find(([spec]) => {
        return (spec as { id: string }).id === '__xf-stores';
      });
    expect(shadowAddCall).toBeDefined();
    expect((shadowAddCall![0] as { source: string }).source).toBe(
      '__xf-src-stores'
    );

    // The frame-driven animation must own opacity: MapLibre's default paint
    // transition is disabled on both layers.
    expect(lastPaintValue(map, 'stores', 'circle-opacity-transition')).toEqual({
      duration: 0,
    });
    expect(
      lastPaintValue(map, '__xf-stores', 'circle-opacity-transition')
    ).toEqual({ duration: 0 });

    // Real layer (OLD data) starts fully visible at base; shadow starts hidden.
    expect(lastPaintValue(map, 'stores', 'circle-opacity')).toBe(0.8);
    expect(lastPaintValue(map, 'stores', 'circle-stroke-opacity')).toBe(1);
    expect(lastPaintValue(map, '__xf-stores', 'circle-opacity')).toBe(0);
    expect(lastPaintValue(map, '__xf-stores', 'circle-stroke-opacity')).toBe(0);

    // First frame waits for the shadow's new data to parse; then drive to end.
    advance(0); // shadow ready → fade begins
    advance(200); // p = 0.5
    advance(200); // p = 1

    // NEW data committed to the real source, real restored to base.
    expect(setData).toHaveBeenCalledWith(dataB);
    expect(lastPaintValue(map, 'stores', 'circle-opacity')).toBe(0.8);
    expect(lastPaintValue(map, 'stores', 'circle-stroke-opacity')).toBe(1);

    // Shadow removed.
    expect(map.removeLayer).toHaveBeenCalledWith('__xf-stores');
    expect(map.removeSource).toHaveBeenCalledWith('__xf-src-stores');
  });
});

// ---------------------------------------------------------------------------
// runCrossfades — settle (wait for the real source to parse the new data)
// ---------------------------------------------------------------------------

describe('runCrossfades — settle waits for the new data to parse', () => {
  test('keeps the shadow until the real source reports loaded', () => {
    const { map } = makeMapMock({ sourceLoaded: false });
    const { scheduler, advance } = makeScheduler();

    runCrossfades(
      map as unknown as Parameters<typeof runCrossfades>[0],
      buildSpec(dataB),
      buildSpec(dataA),
      scheduler
    );

    advance(0); // shadow ready → fade begins
    advance(400); // reaches p = 1 → commits new data, enters settle

    // Source still parsing: the real layer stays hidden and the shadow stays.
    expect(map.removeLayer).not.toHaveBeenCalledWith('__xf-stores');
    expect(lastPaintValue(map, 'stores', 'circle-opacity')).toBe(0);

    // Source finishes parsing → next settle frame reveals + tears down.
    map.isSourceLoaded.mockReturnValue(true);
    advance(0);

    expect(lastPaintValue(map, 'stores', 'circle-opacity')).toBe(0.8);
    expect(map.removeLayer).toHaveBeenCalledWith('__xf-stores');
    expect(map.removeSource).toHaveBeenCalledWith('__xf-src-stores');
  });

  test('gives up waiting after the settle ceiling and reveals anyway', () => {
    const { map } = makeMapMock({ sourceLoaded: false });
    const { scheduler, advance } = makeScheduler();

    runCrossfades(
      map as unknown as Parameters<typeof runCrossfades>[0],
      buildSpec(dataB),
      buildSpec(dataA),
      scheduler
    );

    advance(0); // shadow ready → fade begins
    advance(400); // completion → settle begins
    // Never reports loaded; drive well past the ceiling.
    for (let i = 0; i < 130; i++) advance(0);

    expect(map.removeLayer).toHaveBeenCalledWith('__xf-stores');
    expect(lastPaintValue(map, 'stores', 'circle-opacity')).toBe(0.8);
  });

  test('reveals immediately when the map has no isSourceLoaded', () => {
    const { map } = makeMapMock();
    // Simulate an adapter/map build without the capability.
    delete (map as { isSourceLoaded?: unknown }).isSourceLoaded;
    const { scheduler, advance } = makeScheduler();

    runCrossfades(
      map as unknown as Parameters<typeof runCrossfades>[0],
      buildSpec(dataB),
      buildSpec(dataA),
      scheduler
    );

    advance(0); // no isSourceLoaded → shadow treated as ready → fade begins
    advance(200);
    advance(200);

    expect(map.removeLayer).toHaveBeenCalledWith('__xf-stores');
    expect(lastPaintValue(map, 'stores', 'circle-opacity')).toBe(0.8);
  });
});

// ---------------------------------------------------------------------------
// runCrossfades — the fade-in waits for the shadow's new data to parse
// ---------------------------------------------------------------------------

describe('runCrossfades — fade-in waits for the shadow source to parse', () => {
  test('holds the shadow at zero opacity until its new data reports loaded', () => {
    const { map } = makeMapMock();
    // Control when the freshly-added shadow source finishes parsing so we can
    // assert the ramp does not advance while it is still loading (otherwise the
    // new points pop in at whatever opacity the ramp had already reached).
    let shadowLoaded = false;
    map.isSourceLoaded.mockImplementation((id: string) => {
      return id.startsWith('__xf-src-') ? shadowLoaded : true;
    });
    const { scheduler, advance } = makeScheduler();

    runCrossfades(
      map as unknown as Parameters<typeof runCrossfades>[0],
      buildSpec(dataB),
      buildSpec(dataA),
      scheduler
    );

    // Shadow still parsing: advancing time must NOT ramp opacity — the real
    // layer stays fully visible, the shadow stays hidden.
    advance(200);
    advance(200);
    expect(lastPaintValue(map, 'stores', 'circle-opacity')).toBe(0.8);
    expect(lastPaintValue(map, '__xf-stores', 'circle-opacity')).toBe(0);
    expect(map.removeLayer).not.toHaveBeenCalledWith('__xf-stores');

    // Shadow finishes parsing → the fade begins from now and ramps in.
    shadowLoaded = true;
    advance(0); // ready → fade begins
    advance(200); // p = 0.5
    expect(
      lastPaintValue(map, '__xf-stores', 'circle-opacity')
    ).toBeGreaterThan(0);
    expect(lastPaintValue(map, 'stores', 'circle-opacity')).toBeLessThan(0.8);
  });
});

// ---------------------------------------------------------------------------
// runCrossfades — the shadow inherits the layer's feature-state colours
// ---------------------------------------------------------------------------

describe('runCrossfades — colours the shadow via the layer feature-state', () => {
  test('promotes the shadow source id and applies mapData feature-state to it', () => {
    const { map } = makeMapMock();
    const { scheduler, advance } = makeScheduler();

    runCrossfades(
      map as unknown as Parameters<typeof runCrossfades>[0],
      buildSpecWithMapData(dataB),
      buildSpecWithMapData(dataA),
      scheduler
    );

    // The shadow source is created with the real source's id promotion so its
    // feature-state joins by the same key.
    expect(map.addSource).toHaveBeenCalledWith(
      '__xf-src-stores',
      expect.objectContaining({ data: dataB, promoteId: 'code' })
    );

    // Once the shadow parses, the fade begins and the new points are coloured
    // via the same mapData — so they fade in coloured, not as the fallback.
    advance(0); // shadow ready → fade begins + shadow feature-state applied
    expect(map.setFeatureState).toHaveBeenCalledWith(
      { source: '__xf-src-stores', id: 'k1' },
      { value: 'open' }
    );
  });
});

// ---------------------------------------------------------------------------
// runCrossfades — no-op paths
// ---------------------------------------------------------------------------

describe('runCrossfades — no-op when not applicable', () => {
  test('no transition declared → no shadow created', () => {
    const { map } = makeMapMock();
    const { scheduler } = makeScheduler();
    runCrossfades(
      map as unknown as Parameters<typeof runCrossfades>[0],
      buildSpec(dataB, false),
      buildSpec(dataA, false),
      scheduler
    );
    expect(map.addSource).not.toHaveBeenCalled();
    expect(map.addLayer).not.toHaveBeenCalled();
  });

  test('unchanged data reference → no shadow created', () => {
    const { map } = makeMapMock();
    const { scheduler } = makeScheduler();
    runCrossfades(
      map as unknown as Parameters<typeof runCrossfades>[0],
      buildSpec(dataA),
      buildSpec(dataA),
      scheduler
    );
    expect(map.addSource).not.toHaveBeenCalled();
  });

  test('null previousSpec → no shadow created', () => {
    const { map } = makeMapMock();
    const { scheduler } = makeScheduler();
    runCrossfades(
      map as unknown as Parameters<typeof runCrossfades>[0],
      buildSpec(dataB),
      null,
      scheduler
    );
    expect(map.addSource).not.toHaveBeenCalled();
  });

  test('real layer not on the map → no shadow created', () => {
    const { map, layers } = makeMapMock();
    layers.delete('stores'); // real layer not mounted → not eligible
    const { scheduler } = makeScheduler();
    runCrossfades(
      map as unknown as Parameters<typeof runCrossfades>[0],
      buildSpec(dataB),
      buildSpec(dataA),
      scheduler
    );
    expect(map.addSource).not.toHaveBeenCalled();
    expect(map.addLayer).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// runCrossfades — cancel mid-animation
// ---------------------------------------------------------------------------

describe('runCrossfades — second change cancels the first', () => {
  test('starting a new crossfade tears the previous one down first', () => {
    const { map, setData } = makeMapMock();
    const { scheduler, advance } = makeScheduler();

    // First crossfade A → B.
    runCrossfades(
      map as unknown as Parameters<typeof runCrossfades>[0],
      buildSpec(dataB),
      buildSpec(dataA),
      scheduler
    );
    advance(200); // p = 0.5, still animating

    map.removeLayer.mockClear();
    map.removeSource.mockClear();
    setData.mockClear();

    // Second crossfade B → A mid-animation cancels the first.
    runCrossfades(
      map as unknown as Parameters<typeof runCrossfades>[0],
      buildSpec(dataA),
      buildSpec(dataB),
      scheduler
    );

    // The first shadow was torn down (stop() → finalize) before the new one,
    // and its pending new data (dataB) was committed on cancel.
    expect(setData).toHaveBeenCalledWith(dataB);
    expect(map.removeLayer).toHaveBeenCalledWith('__xf-stores');
    expect(map.removeSource).toHaveBeenCalledWith('__xf-src-stores');
    // And a fresh shadow was added again.
    expect(
      jest.mocked(map.addLayer).mock.calls.filter(([spec]) => {
        return (spec as { id: string }).id === '__xf-stores';
      })
    ).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// startCrossfade — edge cases
// ---------------------------------------------------------------------------

describe('startCrossfade — edge cases', () => {
  const layerOf = (spec: VisualizationSpec) => {
    return spec.layers[0];
  };

  test('durationMs <= 0 completes as soon as the fade begins', () => {
    const { map, setData } = makeMapMock();
    const { scheduler, advance } = makeScheduler();
    startCrossfade(
      map as unknown as Parameters<typeof startCrossfade>[0],
      {
        layer: layerOf(buildSpec(dataB)),
        sourceId: 'stores-src',
        newData: dataB,
        durationMs: 0,
        easing: 'linear',
        spec: buildSpec(dataB),
      },
      scheduler
    );
    advance(0); // shadow ready → fade begins
    advance(0); // p resolves to 1 immediately
    expect(setData).toHaveBeenCalledWith(dataB);
    expect(lastPaintValue(map, 'stores', 'circle-opacity')).toBe(0.8);
    expect(map.removeLayer).toHaveBeenCalledWith('__xf-stores');
  });

  test('missing real layer → no shadow created (guard)', () => {
    const { map, layers } = makeMapMock();
    layers.delete('stores'); // real layer not mounted
    const { scheduler } = makeScheduler();
    startCrossfade(
      map as unknown as Parameters<typeof startCrossfade>[0],
      {
        layer: layerOf(buildSpec(dataB)),
        sourceId: 'stores-src',
        newData: dataB,
        durationMs: 400,
        easing: 'ease-out',
        spec: buildSpec(dataB),
      },
      scheduler
    );
    expect(map.addSource).not.toHaveBeenCalled();
    expect(map.addLayer).not.toHaveBeenCalled();
  });

  test('defaults to the real scheduler (now/raf/caf) when none injected', () => {
    const { map } = makeMapMock();
    const raf = jest.fn().mockReturnValue(7);
    const caf = jest.fn();
    const originalRaf = globalThis.requestAnimationFrame;
    const originalCaf = globalThis.cancelAnimationFrame;
    const originalPerf = globalThis.performance;
    globalThis.requestAnimationFrame =
      raf as unknown as typeof globalThis.requestAnimationFrame;
    globalThis.cancelAnimationFrame =
      caf as unknown as typeof globalThis.cancelAnimationFrame;
    globalThis.performance = {
      now: () => {
        return 0;
      },
    } as unknown as typeof globalThis.performance;
    try {
      // First start schedules a frame via the default scheduler's raf/now.
      startCrossfade(map as unknown as Parameters<typeof startCrossfade>[0], {
        layer: layerOf(buildSpec(dataB)),
        sourceId: 'stores-src',
        newData: dataB,
        durationMs: 400,
        easing: 'ease-out',
        spec: buildSpec(dataB),
      });
      expect(raf).toHaveBeenCalled();
      // A second start cancels the pending frame via the default scheduler's caf.
      startCrossfade(map as unknown as Parameters<typeof startCrossfade>[0], {
        layer: layerOf(buildSpec(dataA)),
        sourceId: 'stores-src',
        newData: dataA,
        durationMs: 400,
        easing: 'ease-out',
        spec: buildSpec(dataA),
      });
      expect(caf).toHaveBeenCalledWith(7);
    } finally {
      globalThis.requestAnimationFrame = originalRaf;
      globalThis.cancelAnimationFrame = originalCaf;
      globalThis.performance = originalPerf;
    }
  });
});
