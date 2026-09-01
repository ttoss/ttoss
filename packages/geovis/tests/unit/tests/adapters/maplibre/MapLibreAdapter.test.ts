/**
 * Tests for MapLibreAdapter factory isolation and runtime behaviour: instance
 * independence, selection, view sync, patch application and basemap labels.
 *
 * Spec translation lives in MapLibreAdapter.translation.test.ts and
 * feature-state handling in MapLibreAdapter.mapData.test.ts.
 */

import maplibregl from 'maplibre-gl';
import createMapLibreAdapter from 'src/adapters/maplibre/MapLibreAdapter';
import type { VisualizationLayer } from 'src/spec/types';

import {
  installMapLibreDomMocks,
  makeContainer,
  makeMapMock,
  makeSpec,
  resetMapLibreDomMocks,
} from './mapLibreAdapterTestUtils';

jest.mock('maplibre-gl', () => {
  return {
    Map: jest.fn(),
    NavigationControl: jest.fn().mockImplementation(() => {
      return {};
    }),
  };
});

installMapLibreDomMocks();

beforeEach(() => {
  resetMapLibreDomMocks();
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

    adapterA.mount(makeContainer(), makeSpec(), 'view-a');
    adapterB.mount(makeContainer(), makeSpec(), 'view-b');

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

    adapterA.mount(makeContainer(), makeSpec(), 'view-a');
    adapterB.mount(makeContainer(), makeSpec(), 'view-b');

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

    adapterA.mount(makeContainer(), makeSpec(), 'view-a');
    adapterB.mount(makeContainer(), makeSpec(), 'view-b');

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

    const mountedA = adapterA.mount(makeContainer(), makeSpec(), 'view-a');
    adapterB.mount(makeContainer(), makeSpec(), 'view-b');

    mountedA.destroy();

    expect(adapterA.getNativeInstance()).toBeNull();
    expect(adapterB.getNativeInstance()).toBe(mapB);
    expect(mapA.remove).toHaveBeenCalledTimes(1);
    expect(mapB.remove).not.toHaveBeenCalled();
  });

  test('getCapabilities returns the structured capability tree (ADR-0002)', () => {
    const adapter = createMapLibreAdapter();
    expect(adapter.getCapabilities()).toEqual({
      sourceTypes: [
        'geojson',
        'vector-tiles',
        'raster-tiles',
        'raster-dem',
        'image',
        'video',
      ],
      layerGeometries: [
        'polygon',
        'line',
        'point',
        'symbol',
        'heatmap',
        'raster',
      ],
      dataFeatures: {
        featureState: ['geojson'],
        filter: ['geojson'],
      },
      viewFeatures: {
        pitch: true,
        bearing: true,
      },
    });
  });

  test('update does nothing when no map is mounted', () => {
    const adapter = createMapLibreAdapter();
    expect(() => {
      return adapter.update(makeSpec());
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

describe('createMapLibreAdapter — setSelection (PRD-002 select-feature)', () => {
  const makeSpecWithLayer = () => {
    return {
      ...makeSpec(),
      sources: [
        {
          id: 'src-1',
          type: 'geojson' as const,
          data: { type: 'FeatureCollection' as const, features: [] },
        },
      ],
      layers: [
        { id: 'lyr-1', sourceId: 'src-1', geometry: 'polygon' as const },
      ],
    };
  };

  test("applies the selection to every mounted view, keyed by the layer's sourceId", () => {
    const map = makeMapMock();
    jest.mocked(maplibregl.Map).mockImplementationOnce(() => {
      return map as never;
    });
    const adapter = createMapLibreAdapter();
    adapter.mount(makeContainer(), makeSpecWithLayer(), 'view-a');

    adapter.setSelection?.({ layerId: 'lyr-1', featureId: 'BR' });

    expect(map.setFeatureState).toHaveBeenCalledWith(
      { source: 'src-1', id: 'BR' },
      { selected: true }
    );
  });

  test('clears the previous selection before applying the next one', () => {
    const map = makeMapMock();
    jest.mocked(maplibregl.Map).mockImplementationOnce(() => {
      return map as never;
    });
    const adapter = createMapLibreAdapter();
    adapter.mount(makeContainer(), makeSpecWithLayer(), 'view-a');

    adapter.setSelection?.({ layerId: 'lyr-1', featureId: 'BR' });
    adapter.setSelection?.({ layerId: 'lyr-1', featureId: 'AR' });

    expect(map.setFeatureState).toHaveBeenCalledWith(
      { source: 'src-1', id: 'BR' },
      { selected: false }
    );
    expect(map.setFeatureState).toHaveBeenCalledWith(
      { source: 'src-1', id: 'AR' },
      { selected: true }
    );
  });

  test('setSelection does nothing when no map is mounted', () => {
    const adapter = createMapLibreAdapter();
    expect(() => {
      adapter.setSelection?.({ layerId: 'lyr-1', featureId: 'BR' });
    }).not.toThrow();
  });

  test('two adapter instances track selection independently', () => {
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
    adapterA.mount(makeContainer(), makeSpecWithLayer(), 'view-a');
    adapterB.mount(makeContainer(), makeSpecWithLayer(), 'view-b');

    adapterA.setSelection?.({ layerId: 'lyr-1', featureId: 'BR' });

    expect(mapA.setFeatureState).toHaveBeenCalledWith(
      { source: 'src-1', id: 'BR' },
      { selected: true }
    );
    expect(mapB.setFeatureState).not.toHaveBeenCalled();
  });
});

describe('applyPatch — camelCase to MapLibre key translation', () => {
  const mountAdapter = () => {
    const map = makeMapMock();
    // setPaintWhenReady guards on getLayer — return a truthy stub for all
    // layers that exist in the test spec so paint patches are applied.
    jest.mocked(map.getLayer).mockReturnValue({} as never);
    jest.mocked(maplibregl.Map).mockImplementationOnce(() => {
      return map as never;
    });
    const adapter = createMapLibreAdapter();
    const spec = {
      ...makeSpec(),
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
    const spec = makeSpec();
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

  test('changing maxZoomIn calls map.setMaxZoom', () => {
    const { adapter, map, spec } = mountAdapter();
    adapter.update({ ...spec, view: { ...spec.view, maxZoomIn: 16 } });
    expect(map.setMaxZoom).toHaveBeenCalledWith(16);
  });

  test('clearing maxZoomIn resets map.setMaxZoom to null', () => {
    const { adapter, map, spec } = mountAdapter();
    adapter.update({ ...spec, view: { ...spec.view, maxZoomIn: 16 } });
    adapter.update({ ...spec, view: { ...spec.view, maxZoomIn: undefined } });
    expect(map.setMaxZoom).toHaveBeenLastCalledWith(null);
  });

  test('changing maxZoomOut calls map.setMinZoom', () => {
    const { adapter, map, spec } = mountAdapter();
    adapter.update({ ...spec, view: { ...spec.view, maxZoomOut: 4 } });
    expect(map.setMinZoom).toHaveBeenCalledWith(4);
  });

  test('clearing maxZoomOut resets map.setMinZoom to null', () => {
    const { adapter, map, spec } = mountAdapter();
    adapter.update({ ...spec, view: { ...spec.view, maxZoomOut: 4 } });
    adapter.update({ ...spec, view: { ...spec.view, maxZoomOut: undefined } });
    expect(map.setMinZoom).toHaveBeenLastCalledWith(null);
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

describe('applyPatch — add / remove operations', () => {
  const mountAdapter = () => {
    const map = makeMapMock();
    jest.mocked(maplibregl.Map).mockImplementationOnce(() => {
      return map as never;
    });
    const adapter = createMapLibreAdapter();
    const spec = makeSpec();
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
      ...makeSpec(),
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

describe('basemap.labels — symbol layer visibility', () => {
  const makeMapWithStyle = (
    styleLayers: Array<{ id: string; type: string }>
  ) => {
    const handlers: Record<string, Array<(...a: unknown[]) => void>> = {};
    const register = (evt: string, cb: (...a: unknown[]) => void) => {
      handlers[evt] = handlers[evt] ?? [];
      handlers[evt].push(cb);
    };
    const map = {
      ...makeMapMock(),
      on: jest.fn(register),
      once: jest.fn(register),
      off: jest.fn(),
      getStyle: jest.fn(() => {
        return { layers: styleLayers };
      }),
      isStyleLoaded: jest.fn(() => {
        return true;
      }),
    };
    const fire = (evt: string, ...args: unknown[]) => {
      for (const cb of handlers[evt] ?? []) cb(...args);
    };
    return { map, fire };
  };

  const basemapSpec = (
    basemap: { labels?: boolean } | undefined,
    layers: VisualizationLayer[] = []
  ) => {
    return {
      ...makeSpec('bm'),
      ...(basemap ? { basemap } : {}),
      sources: layers.length
        ? [{ id: 'src', type: 'geojson' as const, data: 'https://x/d.json' }]
        : [],
      layers,
    };
  };

  test('labels:false hides every symbol layer on load (basemap + user)', () => {
    const { map, fire } = makeMapWithStyle([
      { id: 'bg', type: 'background' },
      { id: 'roads', type: 'line' },
      { id: 'place-labels', type: 'symbol' },
      { id: 'poi-icons', type: 'symbol' },
      { id: 'my-symbols', type: 'symbol' },
    ]);
    jest.mocked(maplibregl.Map).mockImplementationOnce(() => {
      return map as never;
    });
    const adapter = createMapLibreAdapter();
    adapter.mount(
      makeContainer(),
      basemapSpec({ labels: false }, [
        { id: 'my-symbols', sourceId: 'src', geometry: 'symbol' },
      ]),
      'v'
    );

    fire('load');

    expect(map.setLayoutProperty).toHaveBeenCalledWith(
      'place-labels',
      'visibility',
      'none'
    );
    expect(map.setLayoutProperty).toHaveBeenCalledWith(
      'poi-icons',
      'visibility',
      'none'
    );
    expect(map.setLayoutProperty).toHaveBeenCalledWith(
      'my-symbols',
      'visibility',
      'none'
    );
    expect(map.setLayoutProperty).not.toHaveBeenCalledWith(
      'roads',
      'visibility',
      expect.anything()
    );
  });

  test('labels:true restores basemap symbol layers but skips user symbol layers', () => {
    const { map, fire } = makeMapWithStyle([
      { id: 'place-labels', type: 'symbol' },
      { id: 'my-symbols', type: 'symbol' },
    ]);
    jest.mocked(maplibregl.Map).mockImplementationOnce(() => {
      return map as never;
    });
    const adapter = createMapLibreAdapter();
    adapter.mount(
      makeContainer(),
      basemapSpec({ labels: true }, [
        {
          id: 'my-symbols',
          sourceId: 'src',
          geometry: 'symbol',
          visible: false,
        },
      ]),
      'v'
    );

    fire('load');

    expect(map.setLayoutProperty).toHaveBeenCalledWith(
      'place-labels',
      'visibility',
      'visible'
    );
    expect(map.setLayoutProperty).not.toHaveBeenCalledWith(
      'my-symbols',
      'visibility',
      'visible'
    );
  });

  test('undefined labels leaves symbol layer visibility untouched', () => {
    const { map, fire } = makeMapWithStyle([
      { id: 'place-labels', type: 'symbol' },
    ]);
    jest.mocked(maplibregl.Map).mockImplementationOnce(() => {
      return map as never;
    });
    const adapter = createMapLibreAdapter();
    adapter.mount(makeContainer(), basemapSpec(undefined), 'v');

    fire('load');

    expect(map.setLayoutProperty).not.toHaveBeenCalled();
    expect(map.getStyle).not.toHaveBeenCalled();
  });

  test('updating labels false→true restores basemap symbol visibility', () => {
    const { map, fire } = makeMapWithStyle([
      { id: 'place-labels', type: 'symbol' },
    ]);
    jest.mocked(maplibregl.Map).mockImplementationOnce(() => {
      return map as never;
    });
    const adapter = createMapLibreAdapter();
    const spec = basemapSpec({ labels: false });
    adapter.mount(makeContainer(), spec, 'v');
    fire('load');
    jest.mocked(map.setLayoutProperty).mockClear();

    adapter.update({ ...spec, basemap: { labels: true } });

    expect(map.setLayoutProperty).toHaveBeenCalledWith(
      'place-labels',
      'visibility',
      'visible'
    );
  });

  test('re-hides basemap symbol layers on update when labels stays false', () => {
    const { map, fire } = makeMapWithStyle([
      { id: 'place-labels', type: 'symbol' },
    ]);
    jest.mocked(maplibregl.Map).mockImplementationOnce(() => {
      return map as never;
    });
    const adapter = createMapLibreAdapter();
    const spec = basemapSpec({ labels: false });
    adapter.mount(makeContainer(), spec, 'v');
    fire('load');
    jest.mocked(map.setLayoutProperty).mockClear();

    adapter.update({ ...spec, view: { ...spec.view, zoom: 12 } });

    expect(map.setLayoutProperty).toHaveBeenCalledWith(
      'place-labels',
      'visibility',
      'none'
    );
  });
});

describe('createMapLibreAdapter — attributionControlEnabled', () => {
  const mountWith = (attributionControlEnabled?: boolean) => {
    jest.mocked(maplibregl.Map).mockImplementation(() => {
      return makeMapMock() as never;
    });

    createMapLibreAdapter().mount(
      makeContainer(),
      { ...makeSpec(), attributionControlEnabled },
      'view'
    );

    return jest.mocked(maplibregl.Map).mock.calls[0]?.[0];
  };

  test('leaves MapLibre to mount its own control when the spec is silent', () => {
    // Absent rather than `true`: passing `attributionControl: true` would also
    // produce a control, but through a different MapLibre code path. Saying
    // nothing is what guarantees the untouched default.
    expect(mountWith()).not.toHaveProperty('attributionControl');
  });

  test('keeps the control on an explicit true', () => {
    expect(mountWith(true)).not.toHaveProperty('attributionControl');
  });

  test('suppresses the control on an explicit false', () => {
    expect(mountWith(false)).toMatchObject({ attributionControl: false });
  });
});
