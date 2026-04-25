/**
 * Tests for MapLibreAdapter factory isolation.
 * Verifies that each adapter instance has independent state
 * and that destroying one does not affect another.
 */

import maplibregl from 'maplibre-gl';
import createMapLibreAdapter, {
  toMaplibreLayer,
  toMaplibreSource,
} from 'src/adapters/maplibre/MapLibreAdapter';
import type {
  DataSource,
  HeatmapPaint,
  SymbolPaint,
  VisualizationLayer,
} from 'src/spec/types';

jest.mock('maplibre-gl', () => {
  return {
    Map: jest.fn(),
    NavigationControl: jest.fn().mockImplementation(() => {
      return {};
    }),
  };
});

// Mock DOM APIs used by injectMaplibreCSS
Object.defineProperty(global, 'document', {
  value: {
    getElementById: jest.fn(() => {
      return null;
    }),
    createElement: jest.fn(() => {
      return { id: '', rel: '', href: '', style: {} };
    }),
    head: { appendChild: jest.fn() },
  },
  writable: true,
});

Object.defineProperty(global, 'URL', {
  value: jest.fn(() => {
    return { href: 'mocked-css-url' };
  }),
  writable: true,
});

const makeMapMock = () => {
  return {
    on: jest.fn(),
    once: jest.fn(),
    remove: jest.fn(),
    addControl: jest.fn(),
    addSource: jest.fn(),
    addLayer: jest.fn(),
    getSource: jest.fn(() => {
      return null;
    }),
    getLayer: jest.fn(() => {
      return null;
    }),
    removeLayer: jest.fn(),
    removeSource: jest.fn(),
    isStyleLoaded: jest.fn(() => {
      return true;
    }),
    setLayoutProperty: jest.fn(),
    setPaintProperty: jest.fn(),
    setStyle: jest.fn(),
    setCenter: jest.fn(),
    setZoom: jest.fn(),
    setPitch: jest.fn(),
    setBearing: jest.fn(),
  };
};

const makeSpec = (id: string) => {
  return {
    id,
    engine: 'maplibre' as const,
    view: { center: [-46.6, -23.5] as [number, number], zoom: 10 },
    sources: [],
    layers: [],
  };
};

const makeContainer = () => {
  return { style: {} } as unknown as HTMLElement;
};

beforeEach(() => {
  jest.clearAllMocks();
  (document.getElementById as jest.Mock).mockReturnValue(null);
  (document.createElement as jest.Mock).mockReturnValue({
    id: '',
    rel: '',
    href: '',
  });
});

describe('createMapLibreAdapter', () => {
  test('returns a new instance on each call', () => {
    const adapterA = createMapLibreAdapter();
    const adapterB = createMapLibreAdapter();
    expect(adapterA).not.toBe(adapterB);
  });

  test('two instances do not share map state', () => {
    const mapA = makeMapMock();
    const mapB = makeMapMock();
    jest
      .mocked(maplibregl.Map)
      .mockImplementationOnce(() => {
        return mapA as never;
      })
      .mockImplementationOnce(() => {
        return mapB as never;
      });

    const adapterA = createMapLibreAdapter();
    const adapterB = createMapLibreAdapter();

    adapterA.mount(makeContainer(), makeSpec('a'), 'view-a');
    adapterB.mount(makeContainer(), makeSpec('b'), 'view-b');

    expect(adapterA.getNativeInstance()).toBe(mapA);
    expect(adapterB.getNativeInstance()).toBe(mapB);
    expect(adapterA.getNativeInstance()).not.toBe(adapterB.getNativeInstance());
  });

  test('destroying instance A does not nullify instance B native map', () => {
    const mapA = makeMapMock();
    const mapB = makeMapMock();
    jest
      .mocked(maplibregl.Map)
      .mockImplementationOnce(() => {
        return mapA as never;
      })
      .mockImplementationOnce(() => {
        return mapB as never;
      });

    const adapterA = createMapLibreAdapter();
    const adapterB = createMapLibreAdapter();

    adapterA.mount(makeContainer(), makeSpec('a'), 'view-a');
    adapterB.mount(makeContainer(), makeSpec('b'), 'view-b');

    adapterA.destroy();

    expect(adapterA.getNativeInstance()).toBeNull();
    expect(adapterB.getNativeInstance()).toBe(mapB);
  });

  test('destroying instance B does not nullify instance A native map', () => {
    const mapA = makeMapMock();
    const mapB = makeMapMock();
    jest
      .mocked(maplibregl.Map)
      .mockImplementationOnce(() => {
        return mapA as never;
      })
      .mockImplementationOnce(() => {
        return mapB as never;
      });

    const adapterA = createMapLibreAdapter();
    const adapterB = createMapLibreAdapter();

    adapterA.mount(makeContainer(), makeSpec('a'), 'view-a');
    adapterB.mount(makeContainer(), makeSpec('b'), 'view-b');

    adapterB.destroy();

    expect(adapterB.getNativeInstance()).toBeNull();
    expect(adapterA.getNativeInstance()).toBe(mapA);
  });

  test('MountedView.destroy() clears only its own map reference', () => {
    const mapA = makeMapMock();
    const mapB = makeMapMock();
    jest
      .mocked(maplibregl.Map)
      .mockImplementationOnce(() => {
        return mapA as never;
      })
      .mockImplementationOnce(() => {
        return mapB as never;
      });

    const adapterA = createMapLibreAdapter();
    const adapterB = createMapLibreAdapter();

    const mountedA = adapterA.mount(makeContainer(), makeSpec('a'), 'view-a');
    adapterB.mount(makeContainer(), makeSpec('b'), 'view-b');

    mountedA.destroy();

    expect(adapterA.getNativeInstance()).toBeNull();
    expect(adapterB.getNativeInstance()).toBe(mapB);
    expect(mapA.remove).toHaveBeenCalledTimes(1);
    expect(mapB.remove).not.toHaveBeenCalled();
  });

  test('getCapabilities returns correct capabilities', () => {
    const adapter = createMapLibreAdapter();
    expect(adapter.getCapabilities()).toEqual({
      supports3D: false,
      supportsRaster: true,
      supportsVectorTiles: true,
      supportsCustomLayers: true,
    });
  });

  test('update does nothing when no map is mounted', () => {
    const adapter = createMapLibreAdapter();
    expect(() => {
      return adapter.update(makeSpec('x'));
    }).not.toThrow();
  });

  test('applyPatch does nothing when no map is mounted', () => {
    const adapter = createMapLibreAdapter();
    expect(() => {
      return adapter.applyPatch?.({
        target: 'layer',
        op: 'replace',
        path: 'layer.my-layer.fill-color',
        value: '#ff0000',
      });
    }).not.toThrow();
  });
});

describe('toMaplibreSource', () => {
  test('geojson source with url string', () => {
    const source: DataSource = {
      id: 's1',
      type: 'geojson',
      data: 'https://example.com/data.geojson',
    };
    expect(toMaplibreSource(source)).toMatchObject({
      type: 'geojson',
      data: 'https://example.com/data.geojson',
    });
  });

  test('vector-tiles source', () => {
    const source: DataSource = {
      id: 's2',
      type: 'vector-tiles',
      tiles: ['https://example.com/{z}/{x}/{y}.pbf'],
      minzoom: 0,
      maxzoom: 14,
      attribution: '© Example',
    };
    expect(toMaplibreSource(source)).toMatchObject({
      type: 'vector',
      tiles: ['https://example.com/{z}/{x}/{y}.pbf'],
      minzoom: 0,
      maxzoom: 14,
      attribution: '© Example',
    });
  });

  test('raster-tiles source applies default tileSize 256', () => {
    const source: DataSource = {
      id: 's3',
      type: 'raster-tiles',
      tiles: ['https://example.com/{z}/{x}/{y}.png'],
    };
    expect(toMaplibreSource(source)).toMatchObject({
      type: 'raster',
      tileSize: 256,
    });
  });

  test('raster-tiles source respects explicit tileSize 512', () => {
    const source: DataSource = {
      id: 's3b',
      type: 'raster-tiles',
      tiles: ['https://tile.example/{z}/{x}/{y}.png'],
      tileSize: 512,
    };
    expect(toMaplibreSource(source)).toMatchObject({
      type: 'raster',
      tileSize: 512,
    });
  });

  test('image source', () => {
    const source: DataSource = {
      id: 's4',
      type: 'image',
      url: 'https://example.com/image.png',
      coordinates: [
        [-80, 25],
        [-80, 26],
        [-79, 26],
        [-79, 25],
      ],
    };
    expect(toMaplibreSource(source)).toMatchObject({
      type: 'image',
      url: 'https://example.com/image.png',
    });
  });

  test('raster-dem source with encoding', () => {
    const source: DataSource = {
      id: 's5',
      type: 'raster-dem',
      tiles: ['https://tiles.example/{z}/{x}/{y}.png'],
      encoding: 'terrarium',
    };
    expect(toMaplibreSource(source)).toMatchObject({
      type: 'raster-dem',
      encoding: 'terrarium',
      tileSize: 256,
    });
  });

  test('video source', () => {
    const source: DataSource = {
      id: 's6',
      type: 'video',
      urls: ['https://example.com/v.mp4'],
      coordinates: [
        [-122, 37],
        [-122, 38],
        [-121, 38],
        [-121, 37],
      ],
    };
    expect(toMaplibreSource(source)).toMatchObject({
      type: 'video',
      urls: ['https://example.com/v.mp4'],
    });
  });
});

describe('applyPatch — camelCase to MapLibre key translation', () => {
  const mountAdapter = () => {
    const map = makeMapMock();
    jest.mocked(maplibregl.Map).mockImplementationOnce(() => {
      return map as never;
    });
    const adapter = createMapLibreAdapter();
    const spec = {
      ...makeSpec('p'),
      sources: [
        { id: 'src', type: 'geojson' as const, data: 'https://x.com/d.json' },
      ],
      layers: [
        { id: 'poly', sourceId: 'src', geometry: 'polygon' as const },
        { id: 'ln', sourceId: 'src', geometry: 'line' as const },
        { id: 'pt', sourceId: 'src', geometry: 'point' as const },
      ],
    };
    adapter.mount(makeContainer(), spec, 'v');
    return { adapter, map };
  };

  test('fillColor → fill-color for polygon layer', () => {
    const { adapter, map } = mountAdapter();
    adapter.applyPatch?.({
      target: 'layer',
      op: 'replace',
      path: 'layer.poly.paint.fillColor',
      value: '#ff0000',
    });
    expect(map.setPaintProperty).toHaveBeenCalledWith(
      'poly',
      'fill-color',
      '#ff0000'
    );
  });

  test('lineColor → fill-outline-color for polygon layer', () => {
    const { adapter, map } = mountAdapter();
    adapter.applyPatch?.({
      target: 'layer',
      op: 'replace',
      path: 'layer.poly.paint.lineColor',
      value: '#000000',
    });
    expect(map.setPaintProperty).toHaveBeenCalledWith(
      'poly',
      'fill-outline-color',
      '#000000'
    );
  });

  test('lineColor → line-color for line layer', () => {
    const { adapter, map } = mountAdapter();
    adapter.applyPatch?.({
      target: 'layer',
      op: 'replace',
      path: 'layer.ln.paint.lineColor',
      value: '#0000ff',
    });
    expect(map.setPaintProperty).toHaveBeenCalledWith(
      'ln',
      'line-color',
      '#0000ff'
    );
  });

  test('circleRadius → circle-radius for point layer', () => {
    const { adapter, map } = mountAdapter();
    adapter.applyPatch?.({
      target: 'layer',
      op: 'replace',
      path: 'layer.pt.paint.circleRadius',
      value: 12,
    });
    expect(map.setPaintProperty).toHaveBeenCalledWith(
      'pt',
      'circle-radius',
      12
    );
  });

  test('lineWidth → line-width for line layer', () => {
    const { adapter, map } = mountAdapter();
    adapter.applyPatch?.({
      target: 'layer',
      op: 'replace',
      path: 'layer.ln.paint.lineWidth',
      value: 4,
    });
    expect(map.setPaintProperty).toHaveBeenCalledWith('ln', 'line-width', 4);
  });

  test('lineWidth is ignored for polygon layer (not a valid fill paint property)', () => {
    const { adapter, map } = mountAdapter();
    adapter.applyPatch?.({
      target: 'layer',
      op: 'replace',
      path: 'layer.poly.paint.lineWidth',
      value: 4,
    });
    expect(map.setPaintProperty).not.toHaveBeenCalled();
  });

  test('unknown spec key is ignored (no setPaintProperty call)', () => {
    const { adapter, map } = mountAdapter();
    adapter.applyPatch?.({
      target: 'layer',
      op: 'replace',
      path: 'layer.poly.paint.unknownKey',
      value: 'x',
    });
    expect(map.setPaintProperty).not.toHaveBeenCalled();
  });
});

describe('update() — view state sync', () => {
  const mountAdapter = () => {
    const map = makeMapMock();
    jest.mocked(maplibregl.Map).mockImplementationOnce(() => {
      return map as never;
    });
    const adapter = createMapLibreAdapter();
    const spec = makeSpec('vs');
    adapter.mount(makeContainer(), spec, 'v');
    return { adapter, map, spec };
  };

  test('changing center calls map.setCenter', () => {
    const { adapter, map, spec } = mountAdapter();
    adapter.update({ ...spec, view: { ...spec.view, center: [-43.0, -22.0] } });
    expect(map.setCenter).toHaveBeenCalledWith([-43.0, -22.0]);
  });

  test('changing zoom calls map.setZoom', () => {
    const { adapter, map, spec } = mountAdapter();
    adapter.update({ ...spec, view: { ...spec.view, zoom: 15 } });
    expect(map.setZoom).toHaveBeenCalledWith(15);
  });

  test('changing pitch calls map.setPitch', () => {
    const { adapter, map, spec } = mountAdapter();
    adapter.update({ ...spec, view: { ...spec.view, pitch: 45 } });
    expect(map.setPitch).toHaveBeenCalledWith(45);
  });

  test('changing bearing calls map.setBearing', () => {
    const { adapter, map, spec } = mountAdapter();
    adapter.update({ ...spec, view: { ...spec.view, bearing: 90 } });
    expect(map.setBearing).toHaveBeenCalledWith(90);
  });

  test('unchanged view does not call setCenter or setZoom', () => {
    const { adapter, map, spec } = mountAdapter();
    adapter.update({ ...spec });
    expect(map.setCenter).not.toHaveBeenCalled();
    expect(map.setZoom).not.toHaveBeenCalled();
  });
});

describe('toMaplibreLayer', () => {
  const base = { id: 'l1', sourceId: 's1', visible: true as const };

  test('polygon → fill with defaults', () => {
    const layer: VisualizationLayer = { ...base, geometry: 'polygon' };
    expect(toMaplibreLayer(layer)).toMatchObject({
      type: 'fill',
      paint: { 'fill-color': '#3b82f6', 'fill-opacity': 0.6 },
    });
  });

  test('polygon with custom paint', () => {
    const layer: VisualizationLayer = {
      ...base,
      geometry: 'polygon',
      paint: { fillColor: '#ff0000', fillOpacity: 0.9, lineColor: '#000' },
    };
    expect(toMaplibreLayer(layer)).toMatchObject({
      paint: { 'fill-color': '#ff0000', 'fill-opacity': 0.9 },
    });
  });

  test('line → line with defaults', () => {
    const layer: VisualizationLayer = { ...base, geometry: 'line' };
    expect(toMaplibreLayer(layer)).toMatchObject({
      type: 'line',
      paint: { 'line-color': '#3b82f6', 'line-width': 2 },
    });
  });

  test('point → circle', () => {
    const layer: VisualizationLayer = { ...base, geometry: 'point' };
    expect(toMaplibreLayer(layer)).toMatchObject({ type: 'circle' });
  });

  test('symbol → symbol layer with text/icon paint and layout', () => {
    const layer: VisualizationLayer = {
      ...base,
      geometry: 'symbol',
      paint: { textField: 'Hello', textSize: 14 } as SymbolPaint,
    };
    const result = toMaplibreLayer(layer);
    expect(result).toMatchObject({ type: 'symbol' });
    expect(
      (result as { layout: Record<string, unknown> }).layout
    ).toMatchObject({ 'text-field': 'Hello', 'text-size': 14 });
    expect((result as { paint: Record<string, unknown> }).paint).toMatchObject({
      'text-color': '#000000',
      'text-opacity': 1,
    });
  });

  test('heatmap → heatmap layer with heatmap paint properties', () => {
    const layer: VisualizationLayer = {
      ...base,
      geometry: 'heatmap',
      paint: { heatmapRadius: 20, heatmapOpacity: 0.8 } as HeatmapPaint,
    };
    const result = toMaplibreLayer(layer);
    expect(result).toMatchObject({ type: 'heatmap' });
    expect((result as { paint: Record<string, unknown> }).paint).toMatchObject({
      'heatmap-radius': 20,
      'heatmap-opacity': 0.8,
      'heatmap-intensity': 1,
      'heatmap-weight': 1,
    });
  });

  test('raster → raster', () => {
    const layer: VisualizationLayer = { ...base, geometry: 'raster' };
    expect(toMaplibreLayer(layer)).toMatchObject({
      type: 'raster',
      paint: { 'raster-opacity': 1 },
    });
  });

  test('visible: false → layout visibility none', () => {
    const layer: VisualizationLayer = {
      ...base,
      geometry: 'polygon',
      visible: false,
    };
    expect(toMaplibreLayer(layer)).toHaveProperty('layout.visibility', 'none');
  });

  test('visible: true → layout visibility visible', () => {
    const layer: VisualizationLayer = { ...base, geometry: 'line' };
    expect(toMaplibreLayer(layer)).toHaveProperty(
      'layout.visibility',
      'visible'
    );
  });
});

describe('applyPatch — add / remove operations', () => {
  const mountAdapter = () => {
    const map = makeMapMock();
    jest.mocked(maplibregl.Map).mockImplementationOnce(() => {
      return map as never;
    });
    const adapter = createMapLibreAdapter();
    const spec = makeSpec('vs');
    adapter.mount(makeContainer(), spec, 'v');
    return { adapter, map, spec };
  };

  test('op:add target:layer → calls map.addLayer with the converted layer', () => {
    const { adapter, map } = mountAdapter();
    // getLayer returns null by default in makeMapMock, so addLayer should fire.
    const newLayer: VisualizationLayer = {
      id: 'new-layer',
      sourceId: 'vs-src',
      geometry: 'polygon',
      visible: true,
    };
    adapter.applyPatch?.({ target: 'layer', op: 'add', value: newLayer });
    expect(map.addLayer).toHaveBeenCalledTimes(1);
    const calledWith = jest.mocked(map.addLayer).mock.calls[0][0];
    expect(calledWith).toMatchObject({ id: 'new-layer', type: 'fill' });
  });

  test('op:remove target:source → calls map.removeSource when source exists', () => {
    const { adapter, map } = mountAdapter();
    // Mock getSource to simulate the source being present on the map.
    jest.mocked(map.getSource).mockReturnValue({} as never);
    adapter.applyPatch?.({ target: 'source', op: 'remove', value: 'vs-src' });
    expect(map.removeSource).toHaveBeenCalledWith('vs-src');
  });
});

describe('syncSourcesAndLayers — GeoJSON setData', () => {
  const mountAndFireLoad = () => {
    const map = makeMapMock();
    const setData = jest.fn();
    jest.mocked(maplibregl.Map).mockImplementationOnce(() => {
      return map as never;
    });
    const adapter = createMapLibreAdapter();
    const initialSpec = {
      ...makeSpec('gj'),
      sources: [
        {
          id: 'geo-src',
          type: 'geojson' as const,
          data: 'https://example.com/v1.geojson',
        },
      ],
      layers: [],
    };
    adapter.mount(makeContainer(), initialSpec, 'v');
    // Simulate source already registered on the map and expose setData mock.
    jest
      .mocked(map.getSource)
      .mockReturnValue({ setData } as unknown as ReturnType<
        typeof map.getSource
      >);
    return { adapter, map, setData, initialSpec };
  };

  test('calls setData when GeoJSON source data changes on update', () => {
    const { adapter, map, setData, initialSpec } = mountAndFireLoad();

    const nextSpec = {
      ...initialSpec,
      sources: [
        {
          id: 'geo-src',
          type: 'geojson' as const,
          data: 'https://example.com/v2.geojson',
        },
      ],
    };

    // isStyleLoaded returns true so syncSourcesAndLayers runs immediately.
    jest.mocked(map.isStyleLoaded).mockReturnValue(true);
    adapter.update(nextSpec);

    expect(setData).toHaveBeenCalledWith('https://example.com/v2.geojson');
  });

  test('does not call setData when GeoJSON source data is unchanged', () => {
    const { adapter, map, setData, initialSpec } = mountAndFireLoad();

    jest.mocked(map.isStyleLoaded).mockReturnValue(true);
    adapter.update({ ...initialSpec });

    expect(setData).not.toHaveBeenCalled();
  });
});

describe('mapData — feature-state application', () => {
  const makeMapWithEvents = () => {
    const handlers: Record<string, Array<(...a: unknown[]) => void>> = {};
    const map = {
      ...makeMapMock(),
      on: jest.fn((evt: string, cb: (...a: unknown[]) => void) => {
        handlers[evt] = handlers[evt] ?? [];
        handlers[evt].push(cb);
      }),
      off: jest.fn((evt: string, cb: (...a: unknown[]) => void) => {
        handlers[evt] = (handlers[evt] ?? []).filter((h) => {
          return h !== cb;
        });
      }),
      // Source treated as already registered so applyMapDataToSource proceeds.
      getSource: jest.fn(() => {
        return { setData: jest.fn() } as unknown as ReturnType<
          typeof maplibregl.Map.prototype.getSource
        >;
      }),
      isSourceLoaded: jest.fn(() => {
        return true;
      }),
      setFeatureState: jest.fn(),
      removeFeatureState: jest.fn(),
      querySourceFeatures: jest.fn(() => {
        return [];
      }),
    };
    const fire = (evt: string, ...args: unknown[]) => {
      for (const cb of handlers[evt] ?? []) cb(...args);
    };
    return { map, fire };
  };

  const baseSpec = (mapData?: unknown) => {
    return {
      ...makeSpec('md'),
      sources: [
        {
          id: 'states',
          type: 'geojson' as const,
          data: { type: 'FeatureCollection' as const, features: [] },
        },
      ],
      layers: [
        { id: 'fill', sourceId: 'states', geometry: 'polygon' as const },
      ],
      ...(mapData ? { mapData } : {}),
    };
  };

  // 3.1
  test('applies setFeatureState for each row after load (no joinKey → uses feature.id)', () => {
    const { map, fire } = makeMapWithEvents();
    jest.mocked(maplibregl.Map).mockImplementationOnce(() => {
      return map as never;
    });
    const adapter = createMapLibreAdapter();
    adapter.mount(
      makeContainer(),
      baseSpec([
        {
          mapDataId: 'pop',
          mapId: 'states',
          data: [
            { geometryId: 'BR', value: 211 },
            { geometryId: 'AR', value: 45 },
          ],
        },
      ]),
      'v'
    );

    fire('load');

    expect(map.setFeatureState).toHaveBeenCalledTimes(2);
    expect(map.setFeatureState).toHaveBeenCalledWith(
      { source: 'states', id: 'BR' },
      { value: 211 }
    );
    expect(map.setFeatureState).toHaveBeenCalledWith(
      { source: 'states', id: 'AR' },
      { value: 45 }
    );
  });

  // 3.3
  test('applyPatch granular replace calls setFeatureState with the right id and value', () => {
    const { map, fire } = makeMapWithEvents();
    jest.mocked(maplibregl.Map).mockImplementationOnce(() => {
      return map as never;
    });
    const adapter = createMapLibreAdapter();
    adapter.mount(
      makeContainer(),
      baseSpec([
        {
          mapDataId: 'pop',
          mapId: 'states',
          data: [{ geometryId: 'BR', value: 211 }],
        },
      ]),
      'v'
    );
    fire('load');
    jest.mocked(map.setFeatureState).mockClear();

    adapter.applyPatch?.({
      target: 'mapData',
      op: 'replace',
      path: 'mapData.pop.data.BR',
      value: 215,
    });

    expect(map.setFeatureState).toHaveBeenCalledWith(
      { source: 'states', id: 'BR' },
      { value: 215 }
    );
  });

  // 3.6
  test('mounting without mapData never calls setFeatureState (V1 no-regression)', () => {
    const { map, fire } = makeMapWithEvents();
    jest.mocked(maplibregl.Map).mockImplementationOnce(() => {
      return map as never;
    });
    const adapter = createMapLibreAdapter();
    adapter.mount(makeContainer(), baseSpec(), 'v');

    fire('load');

    expect(map.setFeatureState).not.toHaveBeenCalled();
  });
});
