import type maplibregl from 'maplibre-gl';
import { applySelectionToMap } from 'src/adapters/maplibre/selection';
import type { VisualizationSpec } from 'src/spec/types';

const makeMap = () => {
  return { setFeatureState: jest.fn() } as unknown as jest.Mocked<
    Pick<maplibregl.Map, 'setFeatureState'>
  > as unknown as maplibregl.Map;
};

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

describe('applySelectionToMap', () => {
  test("setting a selection on a known layer sets selected: true, keyed by the layer's sourceId", () => {
    const map = makeMap();
    applySelectionToMap(map, makeSpec(), null, {
      layerId: 'lyr-1',
      featureId: 'BR',
    });
    expect(map.setFeatureState).toHaveBeenCalledWith(
      { source: 'src-1', id: 'BR' },
      { selected: true }
    );
    expect(map.setFeatureState).toHaveBeenCalledTimes(1);
  });

  test('replacing a selection clears the previous feature and sets the next one', () => {
    const map = makeMap();
    applySelectionToMap(
      map,
      makeSpec(),
      { layerId: 'lyr-1', featureId: 'BR' },
      { layerId: 'lyr-1', featureId: 'AR' }
    );
    expect(map.setFeatureState).toHaveBeenCalledWith(
      { source: 'src-1', id: 'BR' },
      { selected: false }
    );
    expect(map.setFeatureState).toHaveBeenCalledWith(
      { source: 'src-1', id: 'AR' },
      { selected: true }
    );
    expect(map.setFeatureState).toHaveBeenCalledTimes(2);
  });

  test('clearing to null only clears the previous feature', () => {
    const map = makeMap();
    applySelectionToMap(
      map,
      makeSpec(),
      { layerId: 'lyr-1', featureId: 'BR' },
      null
    );
    expect(map.setFeatureState).toHaveBeenCalledWith(
      { source: 'src-1', id: 'BR' },
      { selected: false }
    );
    expect(map.setFeatureState).toHaveBeenCalledTimes(1);
  });

  test('clearing when nothing was previously selected is a no-op', () => {
    const map = makeMap();
    applySelectionToMap(map, makeSpec(), null, null);
    expect(map.setFeatureState).not.toHaveBeenCalled();
  });

  test('a selection whose layerId is not in spec.layers is silently skipped (sourceId cannot be resolved)', () => {
    const map = makeMap();
    applySelectionToMap(map, makeSpec(), null, {
      layerId: 'ghost',
      featureId: 'BR',
    });
    expect(map.setFeatureState).not.toHaveBeenCalled();
  });
});
