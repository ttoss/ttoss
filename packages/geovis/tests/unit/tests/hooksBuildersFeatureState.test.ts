import type { Map as MapLibreMap, MapGeoJSONFeature } from 'maplibre-gl';
import { readFeatureState } from 'src/react/hooks.builders';

/**
 * Mimics MapLibre's own `getFeatureState` contract: a vector source addressed
 * without `sourceLayer` fires an error event and returns `undefined` instead
 * of a state bag (see `Style#getFeatureState`).
 */
const makeMap = (states: Record<string, { value?: unknown }>) => {
  const getFeatureState = jest.fn(
    (target: {
      source: string;
      sourceLayer?: string;
      id?: string | number;
    }) => {
      if (target.sourceLayer === undefined && target.source === 'tiles') {
        return undefined;
      }
      return states[`${target.source}/${target.id}`];
    }
  );
  return {
    map: { getFeatureState } as unknown as MapLibreMap,
    getFeatureState,
  };
};

const makeFeature = (
  id: string | number,
  sourceLayer?: string
): MapGeoJSONFeature => {
  return {
    id,
    layer: {
      id: 'lyr-1',
      ...(sourceLayer ? { 'source-layer': sourceLayer } : {}),
    },
  } as unknown as MapGeoJSONFeature;
};

describe('readFeatureState', () => {
  test('addresses a tiled feature with its sourceLayer, so the state is found', () => {
    const { map, getFeatureState } = makeMap({ 'tiles/7': { value: 3 } });

    const state = readFeatureState({
      map,
      feature: makeFeature(7, 'clusters'),
      sourceId: 'tiles',
    });

    expect(getFeatureState).toHaveBeenCalledWith({
      source: 'tiles',
      sourceLayer: 'clusters',
      id: 7,
    });
    expect(state).toEqual({ value: 3 });
  });

  test('omits sourceLayer for a geojson feature, which declares none', () => {
    const { map, getFeatureState } = makeMap({ 'src-1/BR': { value: 'x' } });

    const state = readFeatureState({
      map,
      feature: makeFeature('BR'),
      sourceId: 'src-1',
    });

    expect(getFeatureState).toHaveBeenCalledWith({ source: 'src-1', id: 'BR' });
    expect(state).toEqual({ value: 'x' });
  });

  test('returns {} when MapLibre could not address the feature at all', () => {
    // The pre-fix crash: `undefined` came back and the caller read `.value`
    // off it, killing the whole hover/click handler.
    const { map } = makeMap({});

    expect(
      readFeatureState({
        map,
        feature: makeFeature('missing'),
        sourceId: 'ghost',
      })
    ).toEqual({});
  });
});
