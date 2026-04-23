/**
 * Tests for MapLibreAdapter factory isolation.
 * Verifies that each adapter instance has independent state
 * and that destroying one does not affect another.
 */

import maplibregl from 'maplibre-gl';
import createMapLibreAdapter, {
  toMaplibreLayer,
  translateGeoVisData,
} from 'src/adapters/maplibre/MapLibreAdapter';
import type {
  GeoVisDataEntry,
  HeatmapPaint,
  SymbolPaint,
  VisualizationLayer,
} from 'src/spec/types';

jest.mock('maplibre-gl', () => {
  const LngLatBoundsMock = jest.fn().mockImplementation(() => {
    return {
      isEmpty: jest.fn().mockReturnValue(false),
      extend: jest.fn().mockReturnThis(),
    };
  });

  return {
    Map: jest.fn(),
    NavigationControl: jest.fn().mockImplementation(() => {
      return {};
    }),
    LngLatBounds: LngLatBoundsMock,
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
    off: jest.fn(),
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
    fitBounds: jest.fn(),
  };
};

const makeSpec = (id: string) => {
  return {
    id,
    engine: 'maplibre' as const,
    view: { center: [-46.6, -23.5] as [number, number], zoom: 10 },
    data: [] as never[],
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

describe('translateGeoVisData', () => {
  test('geojson-url entry', () => {
    const entry: GeoVisDataEntry = {
      id: 's1',
      kind: 'geojson-url',
      url: 'https://example.com/data.geojson',
    };
    expect(translateGeoVisData(entry)).toMatchObject({
      type: 'geojson',
      data: 'https://example.com/data.geojson',
    });
  });

  test('geojson-inline entry', () => {
    const entry: GeoVisDataEntry = {
      id: 's1b',
      kind: 'geojson-inline',
      geojson: { type: 'FeatureCollection', features: [] },
    };
    expect(translateGeoVisData(entry)).toMatchObject({
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
  });

  test('vector-tiles entry', () => {
    const entry: GeoVisDataEntry = {
      id: 's2',
      kind: 'vector-tiles',
      tiles: ['https://example.com/{z}/{x}/{y}.pbf'],
      minzoom: 0,
      maxzoom: 14,
      attribution: '© Example',
    };
    expect(translateGeoVisData(entry)).toMatchObject({
      type: 'vector',
      tiles: ['https://example.com/{z}/{x}/{y}.pbf'],
      minzoom: 0,
      maxzoom: 14,
      attribution: '© Example',
    });
  });

  test('raster-tiles applies default tileSize 256', () => {
    const entry: GeoVisDataEntry = {
      id: 's3',
      kind: 'raster-tiles',
      tiles: ['https://example.com/{z}/{x}/{y}.png'],
    };
    expect(translateGeoVisData(entry)).toMatchObject({
      type: 'raster',
      tileSize: 256,
    });
  });

  test('raster-tiles respects explicit tileSize 512', () => {
    const entry: GeoVisDataEntry = {
      id: 's3b',
      kind: 'raster-tiles',
      tiles: ['https://tile.example/{z}/{x}/{y}.png'],
      tileSize: 512,
    };
    expect(translateGeoVisData(entry)).toMatchObject({
      type: 'raster',
      tileSize: 512,
    });
  });

  test('image entry', () => {
    const entry: GeoVisDataEntry = {
      id: 's4',
      kind: 'image',
      url: 'https://example.com/image.png',
      coordinates: [
        [-80, 25],
        [-80, 26],
        [-79, 26],
        [-79, 25],
      ],
    };
    expect(translateGeoVisData(entry)).toMatchObject({
      type: 'image',
      url: 'https://example.com/image.png',
    });
  });

  test('raster-dem with encoding', () => {
    const entry: GeoVisDataEntry = {
      id: 's5',
      kind: 'raster-dem',
      tiles: ['https://tiles.example/{z}/{x}/{y}.png'],
      encoding: 'terrarium',
    };
    expect(translateGeoVisData(entry)).toMatchObject({
      type: 'raster-dem',
      encoding: 'terrarium',
      tileSize: 256,
    });
  });

  test('video entry', () => {
    const entry: GeoVisDataEntry = {
      id: 's6',
      kind: 'video',
      urls: ['https://example.com/v.mp4'],
      coordinates: [
        [-122, 37],
        [-122, 38],
        [-121, 38],
        [-121, 37],
      ],
    };
    expect(translateGeoVisData(entry)).toMatchObject({
      type: 'video',
      urls: ['https://example.com/v.mp4'],
    });
  });

  test('native entry is passed through verbatim', () => {
    const entry: GeoVisDataEntry = {
      id: 's7',
      kind: 'native',
      engine: 'maplibre',
      spec: {
        type: 'vector',
        url: 'pmtiles://https://example.com/data.pmtiles',
      },
    };
    expect(translateGeoVisData(entry)).toMatchObject({
      type: 'vector',
      url: 'pmtiles://https://example.com/data.pmtiles',
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
      data: [
        {
          id: 'src',
          kind: 'geojson-url' as const,
          url: 'https://x.com/d.json',
        },
      ],
      layers: [
        { id: 'poly', dataId: 'src', geometry: 'polygon' as const },
        { id: 'ln', dataId: 'src', geometry: 'line' as const },
        { id: 'pt', dataId: 'src', geometry: 'point' as const },
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
  const base = { id: 'l1', dataId: 's1', visible: true as const };

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
      dataId: 'vs-src',
      geometry: 'polygon',
      visible: true,
    };
    adapter.applyPatch?.({ target: 'layer', op: 'add', value: newLayer });
    expect(map.addLayer).toHaveBeenCalledTimes(1);
    const calledWith = jest.mocked(map.addLayer).mock.calls[0][0];
    expect(calledWith).toMatchObject({ id: 'new-layer', type: 'fill' });
  });

  test('op:remove target:data → calls map.removeSource when source exists', () => {
    const { adapter, map } = mountAdapter();
    // Mock getSource to simulate the source being present on the map.
    jest.mocked(map.getSource).mockReturnValue({} as never);
    adapter.applyPatch?.({ target: 'data', op: 'remove', value: 'vs-src' });
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
      data: [
        {
          id: 'geo-src',
          kind: 'geojson-url' as const,
          url: 'https://example.com/v1.geojson',
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
      data: [
        {
          id: 'geo-src',
          kind: 'geojson-url' as const,
          url: 'https://example.com/v2.geojson',
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

describe('syncSourcesAndLayers — colorBy defaults', () => {
  const mountAdapter = () => {
    const map = makeMapMock();
    jest.mocked(maplibregl.Map).mockImplementationOnce(() => {
      return map as never;
    });
    const adapter = createMapLibreAdapter();

    return { adapter, map };
  };

  test('applies quantitative fill-color expression for polygon layers', () => {
    const { adapter, map } = mountAdapter();
    const spec = {
      ...makeSpec('quant'),
      data: [
        {
          id: 'src',
          kind: 'geojson-inline' as const,
          geojson: {
            type: 'FeatureCollection' as const,
            features: [
              {
                type: 'Feature' as const,
                geometry: null,
                properties: { c1: 10 },
              },
              {
                type: 'Feature' as const,
                geometry: null,
                properties: { c1: 20 },
              },
              {
                type: 'Feature' as const,
                geometry: null,
                properties: { c1: 30 },
              },
            ],
          },
        },
      ],
      layers: [
        {
          id: 'l-quant',
          dataId: 'src',
          geometry: 'polygon' as const,
          colorBy: {
            type: 'quantitative' as const,
            property: 'c1',
            scale: 'quantile' as const,
            bins: 3,
            palette: 'Blues',
          },
        },
      ],
    };

    adapter.mount(makeContainer(), spec, 'v');
    adapter.update(spec);

    const layer = jest.mocked(map.addLayer).mock.calls.slice(-1)[0]?.[0] as {
      paint?: Record<string, unknown>;
    };
    const expression = layer.paint?.['fill-color'] as unknown[];

    expect(Array.isArray(expression)).toBe(true);
    expect(expression[0]).toBe('step');
  });

  test('applies categorical fill-color expression for polygon layers', () => {
    const { adapter, map } = mountAdapter();
    const spec = {
      ...makeSpec('cat'),
      data: [
        {
          id: 'src',
          kind: 'geojson-inline' as const,
          geojson: {
            type: 'FeatureCollection' as const,
            features: [
              {
                type: 'Feature' as const,
                geometry: null,
                properties: { category: 'A' },
              },
              {
                type: 'Feature' as const,
                geometry: null,
                properties: { category: 'B' },
              },
            ],
          },
        },
      ],
      layers: [
        {
          id: 'l-cat',
          dataId: 'src',
          geometry: 'polygon' as const,
          colorBy: {
            type: 'categorical' as const,
            property: 'category',
            palette: 'Blues',
          },
        },
      ],
    };

    adapter.mount(makeContainer(), spec, 'v');
    adapter.update(spec);

    const layer = jest.mocked(map.addLayer).mock.calls.slice(-1)[0]?.[0] as {
      paint?: Record<string, unknown>;
    };
    const expression = layer.paint?.['fill-color'] as unknown[];

    expect(Array.isArray(expression)).toBe(true);
    expect(expression[0]).toBe('match');
  });

  test('keeps explicit fillColor instead of overriding with colorBy defaults', () => {
    const { adapter, map } = mountAdapter();
    const spec = {
      ...makeSpec('explicit-fill'),
      data: [
        {
          id: 'src',
          kind: 'geojson-inline' as const,
          geojson: {
            type: 'FeatureCollection' as const,
            features: [
              {
                type: 'Feature' as const,
                geometry: null,
                properties: { c1: 10 },
              },
            ],
          },
        },
      ],
      layers: [
        {
          id: 'l-explicit',
          dataId: 'src',
          geometry: 'polygon' as const,
          paint: { fillColor: '#123456' },
          colorBy: {
            type: 'quantitative' as const,
            property: 'c1',
            scale: 'quantile' as const,
            bins: 5,
          },
        },
      ],
    };

    adapter.mount(makeContainer(), spec, 'v');
    adapter.update(spec);

    const layer = jest.mocked(map.addLayer).mock.calls.slice(-1)[0]?.[0] as {
      paint?: Record<string, unknown>;
    };
    expect(layer.paint?.['fill-color']).toBe('#123456');
  });
});

// ---------------------------------------------------------------------------
// autoFit — smooth view positioning after URL data loads
// ---------------------------------------------------------------------------

describe('autoFit — smooth view positioning after URL data loads', () => {
  const makeSpecWithUrlData = () => {
    return {
      id: 'autofit-spec',
      engine: 'maplibre' as const,
      view: { center: [0, 0] as [number, number], zoom: 1, autoFit: true },
      data: [
        {
          id: 'geo-url',
          kind: 'geojson-url' as const,
          url: 'https://example.com/data.geojson',
        },
      ],
      layers: [
        { id: 'geo-fill', dataId: 'geo-url', geometry: 'polygon' as const },
      ],
    };
  };

  const mountAndLoad = () => {
    const map = makeMapMock();
    jest.mocked(maplibregl.Map).mockImplementationOnce(() => {
      return map as never;
    });
    const adapter = createMapLibreAdapter();
    adapter.mount(makeContainer(), makeSpecWithUrlData(), 'v');

    // Trigger the 'load' event registered inside mount().
    const loadHandler = jest.mocked(map.on).mock.calls.find(([event]) => {
      return event === 'load';
    })?.[1] as (() => void) | undefined;
    loadHandler?.();

    return { adapter, map };
  };

  test('fitBounds is called with animate:true after URL source finishes loading', async () => {
    const { map } = mountAndLoad();

    // After load fires, autoFitBounds registers a 'sourcedata' handler.
    const sourcedataHandler = jest.mocked(map.on).mock.calls.find(([event]) => {
      return event === 'sourcedata';
    })?.[1] as ((e: Record<string, unknown>) => void) | undefined;
    expect(sourcedataHandler).toBeDefined();

    // Mock getSource to return a GeoJSON source with getBounds().
    const fakeBounds = {
      isEmpty: jest.fn().mockReturnValue(false),
      extend: jest.fn(),
    };
    jest.mocked(map.getSource).mockReturnValueOnce({
      getBounds: jest.fn().mockResolvedValue(fakeBounds),
    } as never);

    // Simulate the sourcedata event for the URL source.
    sourcedataHandler?.({
      dataType: 'source',
      isSourceLoaded: true,
      sourceId: 'geo-url',
    });

    // Flush the getBounds() promise chain.
    await Promise.resolve();
    await Promise.resolve();

    expect(map.fitBounds).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ animate: true })
    );
  });

  test('fitBounds is not called when view.autoFit is false or undefined', () => {
    const map = makeMapMock();
    jest.mocked(maplibregl.Map).mockImplementationOnce(() => {
      return map as never;
    });
    const adapter = createMapLibreAdapter();
    const spec = {
      ...makeSpecWithUrlData(),
      view: { center: [0, 0] as [number, number], zoom: 1 },
    };
    adapter.mount(makeContainer(), spec, 'v');

    const loadHandler = jest.mocked(map.on).mock.calls.find(([event]) => {
      return event === 'load';
    })?.[1] as (() => void) | undefined;
    loadHandler?.();

    expect(map.fitBounds).not.toHaveBeenCalled();
    const sourcedataHandler = jest.mocked(map.on).mock.calls.find(([event]) => {
      return event === 'sourcedata';
    });
    expect(sourcedataHandler).toBeUndefined();
  });

  test('fitBounds is called without animate for inline-only sources (after idle event)', () => {
    const map = makeMapMock();
    jest.mocked(maplibregl.Map).mockImplementationOnce(() => {
      return map as never;
    });
    const adapter = createMapLibreAdapter();
    const specWithInline = {
      id: 'inline-af',
      engine: 'maplibre' as const,
      view: { center: [0, 0] as [number, number], zoom: 1, autoFit: true },
      data: [
        {
          id: 'poly-src',
          kind: 'geojson-inline' as const,
          geojson: {
            type: 'FeatureCollection' as const,
            features: [
              {
                type: 'Feature' as const,
                geometry: {
                  type: 'Polygon' as const,
                  coordinates: [
                    [
                      [0, 0],
                      [1, 0],
                      [1, 1],
                      [0, 1],
                      [0, 0],
                    ],
                  ],
                },
                properties: null,
              },
            ],
          },
        },
      ],
      layers: [
        { id: 'poly-fill', dataId: 'poly-src', geometry: 'polygon' as const },
      ],
    };
    adapter.mount(makeContainer(), specWithInline, 'v');

    const loadHandler = jest.mocked(map.on).mock.calls.find(([event]) => {
      return event === 'load';
    })?.[1] as (() => void) | undefined;
    loadHandler?.();

    // For inline-only sources, autoFitBounds uses map.once('idle', ...) instead of sourcedata.
    const idleHandler = jest.mocked(map.once).mock.calls.find(([event]) => {
      return event === 'idle';
    })?.[1] as (() => void) | undefined;
    expect(idleHandler).toBeDefined();

    idleHandler?.();

    expect(map.fitBounds).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ animate: false })
    );
  });
});
