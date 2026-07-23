import type { Map as MapLibreMap, MapLayerMouseEvent } from 'maplibre-gl';
import {
  buildHandleClick,
  dispatchClearSelection,
} from 'src/react/hooks.builders.click';
import type { GeoVisRuntime } from 'src/runtime/createRuntime';

const makeRuntime = (
  selection: { layerId: string; featureId: string | number } | null = null
) => {
  return {
    getSelection: jest.fn(() => {
      return selection;
    }),
    dispatch: jest.fn(),
  } as unknown as jest.Mocked<GeoVisRuntime>;
};

describe('dispatchClearSelection', () => {
  test('dispatches select-feature with featureId: null when something is selected', () => {
    const runtime = makeRuntime({ layerId: 'lyr-1', featureId: 'BR' });
    dispatchClearSelection(runtime);
    expect(runtime.dispatch).toHaveBeenCalledWith({
      type: 'select-feature',
      layerId: 'lyr-1',
      featureId: null,
    });
  });

  test('is a no-op when nothing is selected', () => {
    const runtime = makeRuntime(null);
    dispatchClearSelection(runtime);
    expect(runtime.dispatch).not.toHaveBeenCalled();
  });
});

describe('buildHandleClick', () => {
  const makeMap = () => {
    return {
      getFeatureState: jest.fn(() => {
        return { value: 42 };
      }),
    } as unknown as MapLibreMap;
  };

  test('clears the selection and calls setClick(null) when the click has no feature', () => {
    const runtime = makeRuntime({ layerId: 'lyr-1', featureId: 'BR' });
    const setClick = jest.fn();
    const handleClick = buildHandleClick({
      map: makeMap(),
      layerId: 'lyr-1',
      sourceByLayerId: new Map([['lyr-1', 'src-1']]),
      setClick,
      runtime,
    });

    handleClick({ features: [] } as unknown as MapLayerMouseEvent);

    expect(runtime.dispatch).toHaveBeenCalledWith({
      type: 'select-feature',
      layerId: 'lyr-1',
      featureId: null,
    });
    expect(setClick).toHaveBeenCalledWith(null);
  });

  test('clears the selection and calls setClick(null) when the resolved layer has no known sourceId', () => {
    const runtime = makeRuntime({ layerId: 'lyr-1', featureId: 'BR' });
    const setClick = jest.fn();
    const handleClick = buildHandleClick({
      map: makeMap(),
      layerId: 'lyr-1',
      sourceByLayerId: new Map(), // empty: sourceId lookup misses
      setClick,
      runtime,
    });

    handleClick({
      features: [{ id: 'feature-1', layer: { id: 'lyr-1' } }],
    } as unknown as MapLayerMouseEvent);

    expect(runtime.dispatch).toHaveBeenCalledWith({
      type: 'select-feature',
      layerId: 'lyr-1',
      featureId: null,
    });
    expect(setClick).toHaveBeenCalledWith(null);
  });

  test('dispatches select-feature and sets click info for a valid click', () => {
    const runtime = makeRuntime(null);
    const setClick = jest.fn();
    const handleClick = buildHandleClick({
      map: makeMap(),
      layerId: 'lyr-1',
      sourceByLayerId: new Map([['lyr-1', 'src-1']]),
      setClick,
      runtime,
    });

    handleClick({
      features: [{ id: 'BR', layer: { id: 'lyr-1' } }],
      lngLat: { lng: -46.6, lat: -23.5 },
      point: { x: 10, y: 20 },
    } as unknown as MapLayerMouseEvent);

    expect(runtime.dispatch).toHaveBeenCalledWith({
      type: 'select-feature',
      layerId: 'lyr-1',
      featureId: 'BR',
    });
    expect(setClick).toHaveBeenCalledWith({
      layerId: 'lyr-1',
      sourceId: 'src-1',
      featureId: 'BR',
      value: 42,
      lngLat: [-46.6, -23.5],
      point: { x: 10, y: 20 },
    });
  });
});
