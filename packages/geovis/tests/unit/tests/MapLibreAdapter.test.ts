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
import type { DataSource, VisualizationLayer } from 'src/spec/types';

jest.mock('maplibre-gl', () => {
  return {
    Map: jest.fn(),
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

  test('symbol → circle', () => {
    const layer: VisualizationLayer = { ...base, geometry: 'symbol' };
    expect(toMaplibreLayer(layer)).toMatchObject({ type: 'circle' });
  });

  test('heatmap → circle', () => {
    const layer: VisualizationLayer = { ...base, geometry: 'heatmap' };
    expect(toMaplibreLayer(layer)).toMatchObject({ type: 'circle' });
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
