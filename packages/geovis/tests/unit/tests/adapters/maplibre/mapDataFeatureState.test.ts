import type maplibregl from 'maplibre-gl';
import {
  applyMapDataToSource,
  removeMapDataFromSource,
} from 'src/adapters/maplibre/mapDataFeatureState';
import type { MapData } from 'src/spec/types';

describe('applyMapDataToSource — stateKey support', () => {
  const createMockMap = (): maplibregl.Map => {
    return {
      getSource: jest.fn(() => {
        return { type: 'geojson' };
      }),
      setFeatureState: jest.fn(),
      querySourceFeatures: jest.fn(() => {
        return [];
      }),
      isSourceLoaded: jest.fn(() => {
        return true;
      }),
    } as unknown as maplibregl.Map;
  };

  test('uses stateKey from MapData when defined', () => {
    const map = createMockMap();
    const mapData: MapData = {
      mapDataId: 'pop-data',
      mapId: 'cities',
      stateKey: 'population',
      data: [
        { geometryId: 'city-1', value: 100000 },
        { geometryId: 'city-2', value: 200000 },
      ],
    };

    applyMapDataToSource(map, mapData);

    const setFeatureStateCalls = jest.mocked(map.setFeatureState).mock.calls;

    expect(setFeatureStateCalls).toHaveLength(2);

    // First call should use stateKey 'population'
    expect(setFeatureStateCalls[0]).toEqual([
      { source: 'cities', id: 'city-1' },
      { population: 100000 },
    ]);

    // Second call should also use stateKey 'population'
    expect(setFeatureStateCalls[1]).toEqual([
      { source: 'cities', id: 'city-2' },
      { population: 200000 },
    ]);
  });

  test('uses "value" as default when stateKey is not defined', () => {
    const map = createMockMap();
    const mapData: MapData = {
      mapDataId: 'pop-data',
      mapId: 'cities',
      // No stateKey defined - should default to 'value'
      data: [
        { geometryId: 'city-1', value: 100000 },
        { geometryId: 'city-2', value: 200000 },
      ],
    };

    applyMapDataToSource(map, mapData);

    const setFeatureStateCalls = jest.mocked(map.setFeatureState).mock.calls;

    expect(setFeatureStateCalls).toHaveLength(2);

    // First call should use default stateKey 'value'
    expect(setFeatureStateCalls[0]).toEqual([
      { source: 'cities', id: 'city-1' },
      { value: 100000 },
    ]);

    // Second call should also use default stateKey 'value'
    expect(setFeatureStateCalls[1]).toEqual([
      { source: 'cities', id: 'city-2' },
      { value: 200000 },
    ]);
  });

  test('with joinKey, sets state directly by geometryId without querySourceFeatures', () => {
    const map = createMockMap();
    const mapData: MapData = {
      mapDataId: 'density-data',
      mapId: 'cities',
      stateKey: 'popDensity',
      joinKey: 'cityName',
      data: [
        { geometryId: 'São Paulo', value: 7500 },
        { geometryId: 'Rio', value: 6500 },
      ],
    };

    applyMapDataToSource(map, mapData);

    // The adapter promotes `joinKey` to `feature.id`, so the join value is the
    // id — state is set directly, never resolved via the viewport-bound query.
    expect(map.querySourceFeatures).not.toHaveBeenCalled();

    const setFeatureStateCalls = jest.mocked(map.setFeatureState).mock.calls;
    expect(setFeatureStateCalls).toEqual([
      [{ source: 'cities', id: 'São Paulo' }, { popDensity: 7500 }],
      [{ source: 'cities', id: 'Rio' }, { popDensity: 6500 }],
    ]);
  });

  test('coerces numeric-string geometryId to a number id', () => {
    const map = createMockMap();
    const mapData: MapData = {
      mapDataId: 'cozinhas',
      mapId: 'municipios',
      joinKey: 'codarea',
      // 7-digit IBGE codes arrive as strings but should be applied as numbers.
      data: [{ geometryId: '3550308', value: 12 }],
    };

    applyMapDataToSource(map, mapData);

    expect(jest.mocked(map.setFeatureState).mock.calls).toEqual([
      [{ source: 'municipios', id: 3550308 }, { value: 12 }],
    ]);
  });
});

describe('removeMapDataFromSource — stateKey support', () => {
  const createMockMap = (): maplibregl.Map => {
    return {
      getSource: jest.fn(() => {
        return { type: 'geojson' };
      }),
      removeFeatureState: jest.fn(),
      setFeatureState: jest.fn(),
      querySourceFeatures: jest.fn(() => {
        return [];
      }),
      isSourceLoaded: jest.fn(() => {
        return true;
      }),
      off: jest.fn(),
    } as unknown as maplibregl.Map;
  };

  test('passes stateKey to removeFeatureState so only that dimension is cleared', () => {
    const map = createMockMap();
    const mapData: MapData = {
      mapDataId: 'pop-data',
      mapId: 'cities',
      stateKey: 'population',
      data: [
        { geometryId: 'city-1', value: 100000 },
        { geometryId: 'city-2', value: 200000 },
      ],
    };

    removeMapDataFromSource(map, mapData);

    const calls = jest.mocked(map.removeFeatureState).mock.calls;
    expect(calls).toHaveLength(2);

    // Each call should include the stateKey as the second argument
    expect(calls[0]).toEqual([
      { source: 'cities', id: 'city-1' },
      'population',
    ]);
    expect(calls[1]).toEqual([
      { source: 'cities', id: 'city-2' },
      'population',
    ]);
  });

  test('defaults to "value" stateKey when stateKey is not defined', () => {
    const map = createMockMap();
    const mapData: MapData = {
      mapDataId: 'legacy-data',
      mapId: 'cities',
      data: [{ geometryId: 'city-1', value: 100000 }],
    };

    removeMapDataFromSource(map, mapData);

    const calls = jest.mocked(map.removeFeatureState).mock.calls;
    expect(calls).toHaveLength(1);
    expect(calls[0]).toEqual([{ source: 'cities', id: 'city-1' }, 'value']);
  });

  test('with joinKey, removes state directly by geometryId without querySourceFeatures', () => {
    const map = createMockMap();
    const mapData: MapData = {
      mapDataId: 'density-data',
      mapId: 'cities',
      stateKey: 'popDensity',
      joinKey: 'cityName',
      data: [{ geometryId: 'São Paulo', value: 7500 }],
    };

    removeMapDataFromSource(map, mapData);

    expect(map.querySourceFeatures).not.toHaveBeenCalled();

    const calls = jest.mocked(map.removeFeatureState).mock.calls;
    expect(calls).toEqual([
      [{ source: 'cities', id: 'São Paulo' }, 'popDensity'],
    ]);
  });

  test('removing one dimension does not affect another on the same source', () => {
    const map = createMockMap();

    const popData: MapData = {
      mapDataId: 'pop',
      mapId: 'cities',
      stateKey: 'population',
      data: [{ geometryId: 'city-1', value: 100000 }],
    };

    // Remove only the population entry — density dimension on same source should remain untouched
    removeMapDataFromSource(map, popData);

    const calls = jest.mocked(map.removeFeatureState).mock.calls;
    expect(calls).toHaveLength(1);

    // Should only remove 'population' key, not 'density'
    expect(calls[0]).toEqual([
      { source: 'cities', id: 'city-1' },
      'population',
    ]);
  });
});
