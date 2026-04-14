/**
 * Tests for MapLibreAdapter factory isolation.
 * Verifies that each adapter instance has independent state
 * and that destroying one does not affect another.
 */

import maplibregl from 'maplibre-gl';
import createMapLibreAdapter from 'src/adapters/maplibre/MapLibreAdapter';

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
