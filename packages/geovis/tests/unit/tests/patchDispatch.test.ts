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
    id: 'test-spec',
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
