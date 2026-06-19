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

  test('uses stateKey with joinKey when defined', () => {
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

    // Mock querySourceFeatures to return features with joinKey
    jest.mocked(map.querySourceFeatures).mockReturnValue([
      {
        id: 'feature-1',
        properties: { cityName: 'São Paulo' },
      } as maplibregl.MapboxGeoJSONFeature,
      {
        id: 'feature-2',
        properties: { cityName: 'Rio' },
      } as maplibregl.MapboxGeoJSONFeature,
    ]);

    applyMapDataToSource(map, mapData);

    const setFeatureStateCalls = jest.mocked(map.setFeatureState).mock.calls;

    expect(setFeatureStateCalls).toHaveLength(2);

    // First call should use stateKey 'popDensity'
    expect(setFeatureStateCalls[0]).toEqual([
      { source: 'cities', id: 'feature-1' },
      { popDensity: 7500 },
    ]);

    // Second call should also use stateKey 'popDensity'
    expect(setFeatureStateCalls[1]).toEqual([
      { source: 'cities', id: 'feature-2' },
      { popDensity: 6500 },
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

  test('passes stateKey with joinKey path', () => {
    const map = createMockMap();
    const mapData: MapData = {
      mapDataId: 'density-data',
      mapId: 'cities',
      stateKey: 'popDensity',
      joinKey: 'cityName',
      data: [{ geometryId: 'São Paulo', value: 7500 }],
    };

    jest.mocked(map.querySourceFeatures).mockReturnValue([
      {
        id: 'feature-1',
        properties: { cityName: 'São Paulo' },
      } as maplibregl.MapboxGeoJSONFeature,
    ]);

    removeMapDataFromSource(map, mapData);

    const calls = jest.mocked(map.removeFeatureState).mock.calls;
    expect(calls).toHaveLength(1);
    expect(calls[0]).toEqual([
      { source: 'cities', id: 'feature-1' },
      'popDensity',
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
