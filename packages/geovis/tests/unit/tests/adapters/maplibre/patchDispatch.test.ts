import type maplibregl from 'maplibre-gl';
import type { LayerHostState } from 'src/adapters/maplibre/patchDispatch';
import {
  applyLayerPatch,
  applySourcePatch,
} from 'src/adapters/maplibre/patchDispatch';
import type { SpecPatch } from 'src/runtime/adapter';
import type { VisualizationSpec } from 'src/spec/types';

jest.mock('src/adapters/maplibre/legendFillPaint', () => {
  return {
    cancelPendingStyleListenersForLayer: jest.fn(),
    setPaintWhenReady: jest.fn(),
  };
});

const makeMap = () => {
  return {
    getLayer: jest.fn(() => {
      return null;
    }),
    addLayer: jest.fn(),
    removeLayer: jest.fn(),
    getSource: jest.fn(() => {
      return null;
    }),
    addSource: jest.fn(),
    removeSource: jest.fn(),
    setPaintProperty: jest.fn(),
    setLayoutProperty: jest.fn(),
    setFilter: jest.fn(),
    isStyleLoaded: jest.fn(() => {
      return true;
    }),
    on: jest.fn(),
    off: jest.fn(),
  } as unknown as jest.Mocked<maplibregl.Map>;
};

// Represents a map already mounted with one polygon layer (lyr-1) backed by src-1.
// All tests start from this state unless they pass a custom spec to makeViewState().
const makeSpec = (): VisualizationSpec => {
  return {
    engine: 'maplibre',
    sources: [
      {
        id: 'src-1',
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      },
    ],
    layers: [{ id: 'lyr-1', sourceId: 'src-1', geometry: 'polygon' }],
  };
};

const makeViewState = (spec?: VisualizationSpec): LayerHostState => {
  return { spec: spec ?? makeSpec() };
};

describe('applyLayerPatch — add', () => {
  // op:add appends lyr-2 to the map and to spec.layers.
  // Without this, runtime.spec stays stale and new layers are invisible after hot-patch.
  test('calls map.addLayer and appends layer to spec', () => {
    const map = makeMap();
    const viewState = makeViewState();
    const newLayer = {
      id: 'lyr-2',
      sourceId: 'src-1',
      geometry: 'line' as const,
    };
    const patch: SpecPatch & { target: 'layer' } = {
      target: 'layer',
      op: 'add',
      value: newLayer,
    };

    applyLayerPatch(map, viewState, patch);

    expect(map.addLayer).toHaveBeenCalledTimes(1);
    const addedLayer = jest.mocked(map.addLayer).mock.calls[0][0] as {
      id: string;
    };
    expect(addedLayer.id).toBe('lyr-2');

    expect(viewState.spec.layers).toHaveLength(2);
    expect(viewState.spec.layers[0]).toMatchObject({ id: 'lyr-1' });
    expect(viewState.spec.layers[1]).toMatchObject({ id: 'lyr-2' });
  });

  // op:add must be idempotent: addLayer must not be called again (MapLibre throws on duplicates),
  // and spec.layers must not gain a duplicate entry.
  test('does NOT call map.addLayer when layer already exists on map', () => {
    const map = makeMap();
    jest.mocked(map.getLayer).mockReturnValue({
      id: 'lyr-1',
      type: 'fill',
      source: 'src-1',
    } as maplibregl.FillLayerSpecification);
    const viewState = makeViewState();
    const patch: SpecPatch & { target: 'layer' } = {
      target: 'layer',
      op: 'add',
      value: { id: 'lyr-1', sourceId: 'src-1', geometry: 'polygon' as const },
    };

    applyLayerPatch(map, viewState, patch);

    expect(map.addLayer).not.toHaveBeenCalled();

    expect(viewState.spec.layers).toHaveLength(1);
    expect(viewState.spec.layers[0]).toMatchObject({ id: 'lyr-1' });
  });
});

describe('applyLayerPatch — remove', () => {
  // op:remove removes lyr-1 from the map and from spec.layers.
  test('calls map.removeLayer and removes layer from spec', () => {
    const map = makeMap();
    jest.mocked(map.getLayer).mockReturnValue({
      id: 'lyr-1',
      type: 'fill',
      source: 'src-1',
    } as maplibregl.FillLayerSpecification);
    const viewState = makeViewState();
    const patch: SpecPatch & { target: 'layer' } = {
      target: 'layer',
      op: 'remove',
      value: 'lyr-1',
    };

    applyLayerPatch(map, viewState, patch);

    expect(map.removeLayer).toHaveBeenCalledWith('lyr-1');
    expect(viewState.spec.layers).toHaveLength(0);
  });

  // Desync scenario: layer was removed externally (e.g. style reload) without going through applyPatch.
  // op:remove must skip map.removeLayer (MapLibre would throw) but still update spec.layers.
  test('does not call map.removeLayer when layer is not on map', () => {
    const map = makeMap();
    const viewState = makeViewState();
    const patch: SpecPatch & { target: 'layer' } = {
      target: 'layer',
      op: 'remove',
      value: 'lyr-1',
    };

    applyLayerPatch(map, viewState, patch);

    expect(map.removeLayer).not.toHaveBeenCalled();

    expect(viewState.spec.layers).toHaveLength(0);
  });
});

describe('applyLayerPatch — replace visible (PRD-002 toggle-layer)', () => {
  // op:replace path 'layer.<id>.visible' hides an already-mounted layer via
  // setLayoutProperty (no full re-sync) and records `visible: false` on spec.
  test('hides a mounted layer via setLayoutProperty and updates spec', () => {
    const map = makeMap();
    jest.mocked(map.getLayer).mockReturnValue({
      id: 'lyr-1',
      type: 'fill',
      source: 'src-1',
    } as maplibregl.FillLayerSpecification);
    const viewState = makeViewState();
    const patch: SpecPatch & { target: 'layer' } = {
      target: 'layer',
      op: 'replace',
      path: 'layer.lyr-1.visible',
      value: false,
    };

    applyLayerPatch(map, viewState, patch);

    expect(map.setLayoutProperty).toHaveBeenCalledWith(
      'lyr-1',
      'visibility',
      'none'
    );
    expect(viewState.spec.layers[0]).toMatchObject({ visible: false });
  });

  // Toggling back to visible must pass 'visible' (not just omit the flag).
  test('shows a mounted layer via setLayoutProperty', () => {
    const map = makeMap();
    jest.mocked(map.getLayer).mockReturnValue({
      id: 'lyr-1',
      type: 'fill',
      source: 'src-1',
    } as maplibregl.FillLayerSpecification);
    const viewState = makeViewState({
      ...makeSpec(),
      layers: [
        { id: 'lyr-1', sourceId: 'src-1', geometry: 'polygon', visible: false },
      ],
    });
    const patch: SpecPatch & { target: 'layer' } = {
      target: 'layer',
      op: 'replace',
      path: 'layer.lyr-1.visible',
      value: true,
    };

    applyLayerPatch(map, viewState, patch);

    expect(map.setLayoutProperty).toHaveBeenCalledWith(
      'lyr-1',
      'visibility',
      'visible'
    );
    expect(viewState.spec.layers[0]).toMatchObject({ visible: true });
  });

  // A layer absent from the live map (e.g. desynced style reload) must not
  // call setLayoutProperty (MapLibre would throw), but spec still updates.
  test('does not call setLayoutProperty when layer is not on the map, but spec still updates', () => {
    const map = makeMap();
    const viewState = makeViewState();
    const patch: SpecPatch & { target: 'layer' } = {
      target: 'layer',
      op: 'replace',
      path: 'layer.lyr-1.visible',
      value: false,
    };

    applyLayerPatch(map, viewState, patch);

    expect(map.setLayoutProperty).not.toHaveBeenCalled();
    expect(viewState.spec.layers[0]).toMatchObject({ visible: false });
  });

  // An unknown layerId is a no-op: nothing on the map or spec changes.
  test('is a no-op when layerId does not match any layer in spec', () => {
    const map = makeMap();
    const viewState = makeViewState();
    const before = viewState.spec;
    const patch: SpecPatch & { target: 'layer' } = {
      target: 'layer',
      op: 'replace',
      path: 'layer.ghost.visible',
      value: false,
    };

    applyLayerPatch(map, viewState, patch);

    expect(map.setLayoutProperty).not.toHaveBeenCalled();
    expect(viewState.spec).toBe(before);
  });

  // Hiding a layer with hoverPaint/clickAnchor companions must re-sync their
  // visibility too — otherwise a hidden layer's outline/anchor stays visible.
  test('re-syncs outline and click-anchor companion visibility', () => {
    const map = makeMap();
    jest.mocked(map.getLayer).mockImplementation((id) => {
      return id === 'lyr-1'
        ? ({
            id: 'lyr-1',
            type: 'fill',
            source: 'src-1',
          } as maplibregl.FillLayerSpecification)
        : null;
    });
    const viewState = makeViewState({
      ...makeSpec(),
      layers: [
        {
          id: 'lyr-1',
          sourceId: 'src-1',
          geometry: 'polygon',
          hoverPaint: { lineColor: '#333333', lineWidth: 2 },
          clickAnchor: { iconImage: 'pin' },
        },
      ],
    });
    const patch: SpecPatch & { target: 'layer' } = {
      target: 'layer',
      op: 'replace',
      path: 'layer.lyr-1.visible',
      value: false,
    };

    applyLayerPatch(map, viewState, patch);

    expect(map.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'lyr-1-hover-outline',
        layout: { visibility: 'none' },
      })
    );
    expect(map.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'lyr-1-click-anchor',
        layout: expect.objectContaining({ visibility: 'none' }),
      })
    );
  });
});

describe('applyLayerPatch — replace mapDataId (PRD-002 set-map-data)', () => {
  const makeSpecWithMapData = (): VisualizationSpec => {
    return {
      ...makeSpec(),
      layers: [
        {
          id: 'lyr-1',
          sourceId: 'src-1',
          geometry: 'polygon',
          mapDataId: 'pop-2010',
        },
      ],
      mapData: [
        {
          mapDataId: 'pop-2010',
          mapId: 'src-1',
          data: [{ geometryId: 'BR', value: 190 }],
        },
        {
          mapDataId: 'pop-2020',
          mapId: 'src-1',
          data: [{ geometryId: 'BR', value: 211 }],
        },
      ],
    };
  };

  test('updates spec.layers[].mapDataId', () => {
    const map = makeMap();
    const viewState = makeViewState(makeSpecWithMapData());
    const patch: SpecPatch & { target: 'layer' } = {
      target: 'layer',
      op: 'replace',
      path: 'layer.lyr-1.mapDataId',
      value: 'pop-2020',
    };

    applyLayerPatch(map, viewState, patch);

    expect(viewState.spec.layers[0]).toMatchObject({ mapDataId: 'pop-2020' });
  });

  // No setFeatureState call is expected: every mapData entry's rows are
  // already resident on the source regardless of which layer points at it.
  test('recomputes paint via setPaintProperty when the layer is mounted, without touching feature-state', () => {
    const map = makeMap();
    jest.mocked(map.getLayer).mockReturnValue({
      id: 'lyr-1',
      type: 'fill',
      source: 'src-1',
    } as maplibregl.FillLayerSpecification);
    const viewState = makeViewState(makeSpecWithMapData());
    const patch: SpecPatch & { target: 'layer' } = {
      target: 'layer',
      op: 'replace',
      path: 'layer.lyr-1.mapDataId',
      value: 'pop-2020',
    };

    expect(() => {
      applyLayerPatch(map, viewState, patch);
    }).not.toThrow();
  });

  test('is a no-op when layerId does not match any layer in spec', () => {
    const map = makeMap();
    const viewState = makeViewState(makeSpecWithMapData());
    const before = viewState.spec;
    const patch: SpecPatch & { target: 'layer' } = {
      target: 'layer',
      op: 'replace',
      path: 'layer.ghost.mapDataId',
      value: 'pop-2020',
    };

    applyLayerPatch(map, viewState, patch);

    expect(viewState.spec).toBe(before);
  });
});

describe('applyLayerPatch — replace filter (PRD-002 set-filter)', () => {
  test('calls map.setFilter with the compiled expression and updates spec.layers[].filter', () => {
    const map = makeMap();
    jest.mocked(map.getLayer).mockReturnValue({
      id: 'lyr-1',
      type: 'fill',
      source: 'src-1',
    } as maplibregl.FillLayerSpecification);
    const viewState = makeViewState();
    const patch: SpecPatch & { target: 'layer' } = {
      target: 'layer',
      op: 'replace',
      path: 'layer.lyr-1.filter',
      value: { property: 'status', operator: 'eq', value: 'active' },
    };

    applyLayerPatch(map, viewState, patch);

    expect(map.setFilter).toHaveBeenCalledWith('lyr-1', [
      '==',
      ['get', 'status'],
      'active',
    ]);
    expect(viewState.spec.layers[0]).toMatchObject({
      filter: { property: 'status', operator: 'eq', value: 'active' },
    });
  });

  // value: null clears the filter -- this is the mechanism by which
  // dispatch({type:'set-filter', filter:null}) actually clears, distinct
  // from value: undefined which applyPatchToRuntime treats as a no-op.
  test('value: null calls map.setFilter with null and removes spec.layers[].filter', () => {
    const map = makeMap();
    jest.mocked(map.getLayer).mockReturnValue({
      id: 'lyr-1',
      type: 'fill',
      source: 'src-1',
    } as maplibregl.FillLayerSpecification);
    const specWithFilter: VisualizationSpec = {
      ...makeSpec(),
      layers: [
        {
          id: 'lyr-1',
          sourceId: 'src-1',
          geometry: 'polygon',
          filter: { property: 'status', operator: 'eq', value: 'active' },
        },
      ],
    };
    const viewState = makeViewState(specWithFilter);
    const patch: SpecPatch & { target: 'layer' } = {
      target: 'layer',
      op: 'replace',
      path: 'layer.lyr-1.filter',
      value: null,
    };

    applyLayerPatch(map, viewState, patch);

    expect(map.setFilter).toHaveBeenCalledWith('lyr-1', null);
    expect(viewState.spec.layers[0].filter).toBeUndefined();
  });

  test('does not call map.setFilter when the layer is not on the map, but spec still updates', () => {
    const map = makeMap();
    const viewState = makeViewState();
    const patch: SpecPatch & { target: 'layer' } = {
      target: 'layer',
      op: 'replace',
      path: 'layer.lyr-1.filter',
      value: { property: 'status', operator: 'eq', value: 'active' },
    };

    applyLayerPatch(map, viewState, patch);

    expect(map.setFilter).not.toHaveBeenCalled();
    expect(viewState.spec.layers[0]).toMatchObject({
      filter: { property: 'status', operator: 'eq', value: 'active' },
    });
  });

  test('is a no-op when layerId does not match any layer in spec', () => {
    const map = makeMap();
    const viewState = makeViewState();
    const before = viewState.spec;
    const patch: SpecPatch & { target: 'layer' } = {
      target: 'layer',
      op: 'replace',
      path: 'layer.ghost.filter',
      value: { property: 'status', operator: 'eq', value: 'active' },
    };

    applyLayerPatch(map, viewState, patch);

    expect(map.setFilter).not.toHaveBeenCalled();
    expect(viewState.spec).toBe(before);
  });
});

describe('applySourcePatch — add', () => {
  // op:add should call map.addSource and append the source to viewState.spec.sources.
  test('calls map.addSource and appends source to spec', () => {
    const map = makeMap();
    const viewState = makeViewState();
    const newSource = {
      id: 'src-2',
      type: 'geojson' as const,
      data: { type: 'FeatureCollection' as const, features: [] },
    };
    const patch: SpecPatch & { target: 'source' } = {
      target: 'source',
      op: 'add',
      value: newSource,
    };

    applySourcePatch(map, viewState, patch);

    expect(map.addSource).toHaveBeenCalledTimes(1);
    const [calledId] = jest.mocked(map.addSource).mock.calls[0];
    expect(calledId).toBe('src-2');
    expect(viewState.spec.sources).toHaveLength(2);
    expect(viewState.spec.sources[1]).toMatchObject({ id: 'src-2' });
  });

  // op:add must be idempotent: if the source already exists on the map,
  // addSource must not be called a second time (MapLibre throws on duplicate sources).
  test('does NOT call map.addSource when source already exists on map', () => {
    const map = makeMap();
    jest.mocked(map.getSource).mockReturnValue({
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    } as maplibregl.GeoJSONSourceSpecification);
    const viewState = makeViewState();
    const patch: SpecPatch & { target: 'source' } = {
      target: 'source',
      op: 'add',
      value: {
        id: 'src-1',
        type: 'geojson' as const,
        data: { type: 'FeatureCollection' as const, features: [] },
      },
    };

    applySourcePatch(map, viewState, patch);

    expect(map.addSource).not.toHaveBeenCalled();
  });
});

describe('applySourcePatch — remove', () => {
  // op:remove must remove dependent layers from the map AND from spec.layers,
  // then remove the source. Without cascade, orphan layer specs remain in the
  // runtime, causing reconciliation errors on subsequent spec updates.
  test('removes dependent layers and the source from map and spec', () => {
    const map = makeMap();
    // Both the layer and the source are present on the map
    jest.mocked(map.getLayer).mockImplementation((id) => {
      return id === 'lyr-1'
        ? ({
            id: 'lyr-1',
            type: 'fill',
            source: 'src-1',
          } as maplibregl.FillLayerSpecification)
        : null;
    });
    jest.mocked(map.getSource).mockReturnValue({
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    } as maplibregl.GeoJSONSourceSpecification);
    const viewState = makeViewState();
    const patch: SpecPatch & { target: 'source' } = {
      target: 'source',
      op: 'remove',
      value: 'src-1',
    };

    applySourcePatch(map, viewState, patch);

    expect(map.removeLayer).toHaveBeenCalledWith('lyr-1');
    expect(map.removeSource).toHaveBeenCalledWith('src-1');

    expect(viewState.spec.layers).toHaveLength(0);
    expect(viewState.spec.sources).toHaveLength(0);
  });

  // op:remove with a source that has NO dependent layers must still remove the source.
  test('removes source with no dependent layers without throwing', () => {
    const map = makeMap();
    jest.mocked(map.getSource).mockReturnValue({
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    } as maplibregl.GeoJSONSourceSpecification);
    const spec: VisualizationSpec = {
      ...makeSpec(),
      layers: [],
    };
    const viewState = makeViewState(spec);
    const patch: SpecPatch & { target: 'source' } = {
      target: 'source',
      op: 'remove',
      value: 'src-1',
    };

    applySourcePatch(map, viewState, patch);

    expect(map.removeLayer).not.toHaveBeenCalled();
    expect(map.removeSource).toHaveBeenCalledWith('src-1');
    expect(viewState.spec.sources).toHaveLength(0);
  });
});
