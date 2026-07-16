import {
  buildHandleClick,
  buildHandleMove,
  clearHover,
  clearSelected,
  coerceFeatureStateValue,
  decodeClickTrackedKey,
  decodeHoverTrackedKey,
  TRACKED_FIELD_SEP,
  TRACKED_RECORD_SEP,
} from 'src/react/hooks.builders';
import { makeMapMock as makeBaseMapMock } from 'tests/unit/helpers/makeMapMock';

jest.mock('maplibre-gl', () => {
  return {
    Map: jest.fn(),
    NavigationControl: jest.fn().mockImplementation(() => {
      return {};
    }),
  };
});

const makeMapMock = () => {
  return makeBaseMapMock({
    getCanvas: jest.fn(() => {
      return {
        style: {},
        getBoundingClientRect: () => {
          return { left: 0, top: 0 };
        },
      };
    }),
  });
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('clearHover', () => {
  test('skips setFeatureState when prevHoveredState is undefined', () => {
    const map = makeMapMock();
    const setHover = jest.fn();
    clearHover(map as never, setHover, undefined);
    expect(map.setFeatureState).not.toHaveBeenCalled();
    expect(setHover).toHaveBeenCalledWith(null);
  });

  test('skips setFeatureState when prevHoveredState.current is null', () => {
    const map = makeMapMock();
    const setHover = jest.fn();
    const prevHoveredState = { current: null };
    clearHover(map as never, setHover, prevHoveredState);
    expect(map.setFeatureState).not.toHaveBeenCalled();
    expect(setHover).toHaveBeenCalledWith(null);
  });

  test('sets hover:false and clears ref when prevHoveredState.current exists', () => {
    const canvasStyle: Record<string, string> = {};
    const map = {
      ...makeMapMock(),
      getCanvas: jest.fn(() => {
        return { style: canvasStyle };
      }),
    };
    const setHover = jest.fn();
    const prevHoveredState = {
      current: { sourceId: 'src-1', id: 'feat-42' },
    };
    clearHover(map as never, setHover, prevHoveredState);
    expect(map.setFeatureState).toHaveBeenCalledWith(
      { source: 'src-1', id: 'feat-42' },
      { hover: false }
    );
    expect(prevHoveredState.current).toBeNull();
    expect(canvasStyle.cursor).toBe('');
    expect(setHover).toHaveBeenCalledWith(null);
  });
});

describe('clearSelected', () => {
  test('skips setFeatureState when prevSelectedState.current is null', () => {
    const map = makeMapMock();
    const prevSelectedState = { current: null };
    clearSelected(map as never, prevSelectedState);
    expect(map.setFeatureState).not.toHaveBeenCalled();
  });

  test('sets selected:false and clears ref when prevSelectedState.current exists', () => {
    const map = makeMapMock();
    const prevSelectedState = {
      current: { sourceId: 'src-2', id: 'feat-99' },
    };
    clearSelected(map as never, prevSelectedState);
    expect(map.setFeatureState).toHaveBeenCalledWith(
      { source: 'src-2', id: 'feat-99' },
      { selected: false }
    );
    expect(prevSelectedState.current).toBeNull();
  });
});

describe('buildHandleClick', () => {
  const setup = () => {
    const map = makeMapMock();
    const setClick = jest.fn();
    const prevSelectedState = { current: null };
    const sourceByLayerId = new Map([
      ['layer-1', 'src-1'],
      ['layer-2', 'src-2'],
    ]);
    return { map, setClick, prevSelectedState, sourceByLayerId };
  };

  test('returns null and clears state when no feature in event', () => {
    const { map, setClick, prevSelectedState, sourceByLayerId } = setup();
    const handler = buildHandleClick({
      map: map as never,
      layerId: 'layer-1',
      sourceByLayerId,
      setClick,
      prevSelectedState,
      needsSelectedState: true,
    });
    handler({ features: [] } as never);
    expect(setClick).toHaveBeenCalledWith(null);
  });

  test('returns null and clears state when feature.id is null', () => {
    const { map, setClick, prevSelectedState, sourceByLayerId } = setup();
    const handler = buildHandleClick({
      map: map as never,
      layerId: 'layer-1',
      sourceByLayerId,
      setClick,
      prevSelectedState,
      needsSelectedState: true,
    });
    handler({
      features: [{ id: null, layer: { id: 'layer-1' } }],
    } as never);
    expect(setClick).toHaveBeenCalledWith(null);
  });

  test('returns null when sourceId not found in sourceByLayerId map', () => {
    const { map, setClick, prevSelectedState, sourceByLayerId } = setup();
    const handler = buildHandleClick({
      map: map as never,
      layerId: 'unknown-layer',
      sourceByLayerId,
      setClick,
      prevSelectedState,
      needsSelectedState: true,
    });
    handler({
      features: [{ id: 'feat-1', layer: { id: 'unknown-layer' } }],
    } as never);
    expect(setClick).toHaveBeenCalledWith(null);
    expect(map.setFeatureState).not.toHaveBeenCalledWith(
      expect.objectContaining({ id: 'feat-1' }),
      expect.anything()
    );
  });

  test('resolves sourceId via feature.layer.id fallback', () => {
    const { map, setClick, prevSelectedState, sourceByLayerId } = setup();
    const handler = buildHandleClick({
      map: map as never,
      layerId: 'layer-1',
      sourceByLayerId,
      setClick,
      prevSelectedState,
      needsSelectedState: false,
    });
    handler({
      features: [{ id: 'feat-1', layer: { id: 'layer-2' } }],
      lngLat: { lng: -46.6, lat: -23.5 },
      point: { x: 100, y: 200 },
    } as never);
    expect(setClick).toHaveBeenCalledWith(
      expect.objectContaining({
        layerId: 'layer-2',
        sourceId: 'src-2',
        featureId: 'feat-1',
      })
    );
  });

  test('sets selected:true when needsSelectedState is true', () => {
    const { map, setClick, prevSelectedState, sourceByLayerId } = setup();
    const handler = buildHandleClick({
      map: map as never,
      layerId: 'layer-1',
      sourceByLayerId,
      setClick,
      prevSelectedState,
      needsSelectedState: true,
    });
    handler({
      features: [{ id: 'feat-1', layer: { id: 'layer-1' } }],
      lngLat: { lng: -46.6, lat: -23.5 },
      point: { x: 100, y: 200 },
    } as never);
    expect(map.setFeatureState).toHaveBeenCalledWith(
      { source: 'src-1', id: 'feat-1' },
      { selected: true }
    );
    expect(prevSelectedState.current).toEqual({
      sourceId: 'src-1',
      id: 'feat-1',
    });
  });

  test('skips selected:true when needsSelectedState is false', () => {
    const { map, setClick, prevSelectedState, sourceByLayerId } = setup();
    const handler = buildHandleClick({
      map: map as never,
      layerId: 'layer-1',
      sourceByLayerId,
      setClick,
      prevSelectedState,
      needsSelectedState: false,
    });
    handler({
      features: [{ id: 'feat-1', layer: { id: 'layer-1' } }],
      lngLat: { lng: -46.6, lat: -23.5 },
      point: { x: 100, y: 200 },
    } as never);
    // Should not call setFeatureState with selected:true
    expect(map.setFeatureState).not.toHaveBeenCalledWith(
      { source: 'src-1', id: 'feat-1' },
      { selected: true }
    );
  });
});

describe('buildHandleMove', () => {
  const setup = () => {
    const map = makeMapMock();
    const setHover = jest.fn();
    const lastPointRef = { current: null };
    const prevHoveredState = { current: null };
    const sourceByLayerId = new Map([['layer-1', 'src-1']]);
    const hoverPaintLayerIds = new Set(['layer-1']);
    return {
      map,
      setHover,
      lastPointRef,
      prevHoveredState,
      sourceByLayerId,
      hoverPaintLayerIds,
    };
  };

  test('clears hover when no feature in event', () => {
    const {
      map,
      setHover,
      lastPointRef,
      prevHoveredState,
      sourceByLayerId,
      hoverPaintLayerIds,
    } = setup();
    const handler = buildHandleMove({
      map: map as never,
      layerId: 'layer-1',
      sourceByLayerId,
      setHover,
      lastPointRef,
      prevHoveredState,
      hoverPaintLayerIds,
    });
    handler({ features: [] } as never);
    expect(setHover).toHaveBeenCalledWith(null);
  });

  test('clears hover when sourceId not found', () => {
    const {
      map,
      setHover,
      lastPointRef,
      prevHoveredState,
      sourceByLayerId,
      hoverPaintLayerIds,
    } = setup();
    const handler = buildHandleMove({
      map: map as never,
      layerId: 'unknown-layer',
      sourceByLayerId,
      setHover,
      lastPointRef,
      prevHoveredState,
      hoverPaintLayerIds,
    });
    handler({
      features: [{ id: 'feat-1', layer: { id: 'unknown-layer' } }],
      point: { x: 10, y: 20 },
    } as never);
    expect(setHover).toHaveBeenCalledWith(null);
  });

  test('sets hover:true when feature is in hoverPaintLayerIds', () => {
    const {
      map,
      setHover,
      lastPointRef,
      prevHoveredState,
      sourceByLayerId,
      hoverPaintLayerIds,
    } = setup();
    const handler = buildHandleMove({
      map: map as never,
      layerId: 'layer-1',
      sourceByLayerId,
      setHover,
      lastPointRef,
      prevHoveredState,
      hoverPaintLayerIds,
    });
    handler({
      features: [{ id: 'feat-1', layer: { id: 'layer-1' } }],
      point: { x: 10, y: 20 },
      lngLat: { lng: -46.6, lat: -23.5 },
    } as never);
    expect(map.setFeatureState).toHaveBeenCalledWith(
      { source: 'src-1', id: 'feat-1' },
      { hover: true }
    );
    expect(prevHoveredState.current).toEqual({
      sourceId: 'src-1',
      id: 'feat-1',
    });
    expect(setHover).toHaveBeenCalledWith(
      expect.objectContaining({
        layerId: 'layer-1',
        sourceId: 'src-1',
        featureId: 'feat-1',
      })
    );
  });

  test('does not set hover:true when feature not in hoverPaintLayerIds', () => {
    const { map, setHover, lastPointRef, prevHoveredState, sourceByLayerId } =
      setup();
    const hoverPaintLayerIds = new Set<string>(); // empty set
    const handler = buildHandleMove({
      map: map as never,
      layerId: 'layer-1',
      sourceByLayerId,
      setHover,
      lastPointRef,
      prevHoveredState,
      hoverPaintLayerIds,
    });
    handler({
      features: [{ id: 'feat-1', layer: { id: 'layer-1' } }],
      point: { x: 10, y: 20 },
      lngLat: { lng: -46.6, lat: -23.5 },
    } as never);
    expect(map.setFeatureState).not.toHaveBeenCalledWith(
      { source: 'src-1', id: 'feat-1' },
      { hover: true }
    );
    expect(prevHoveredState.current).toBeNull();
  });

  test('clears previous hover state when hovering over new feature', () => {
    const {
      map,
      setHover,
      lastPointRef,
      prevHoveredState,
      sourceByLayerId,
      hoverPaintLayerIds,
    } = setup();
    const handler = buildHandleMove({
      map: map as never,
      layerId: 'layer-1',
      sourceByLayerId,
      setHover,
      lastPointRef,
      prevHoveredState,
      hoverPaintLayerIds,
    });

    // First hover
    handler({
      features: [{ id: 'feat-1', layer: { id: 'layer-1' } }],
      point: { x: 10, y: 20 },
      lngLat: { lng: -46.6, lat: -23.5 },
    } as never);
    expect(prevHoveredState.current).toEqual({
      sourceId: 'src-1',
      id: 'feat-1',
    });

    // Second hover on different feature — should clear feat-1 first
    jest.mocked(map.setFeatureState).mockClear();
    handler({
      features: [{ id: 'feat-2', layer: { id: 'layer-1' } }],
      point: { x: 30, y: 40 },
      lngLat: { lng: -46.7, lat: -23.6 },
    } as never);
    expect(map.setFeatureState).toHaveBeenCalledWith(
      { source: 'src-1', id: 'feat-1' },
      { hover: false }
    );
    expect(map.setFeatureState).toHaveBeenCalledWith(
      { source: 'src-1', id: 'feat-2' },
      { hover: true }
    );
  });
});

describe('coerceFeatureStateValue', () => {
  test('returns finite numbers as-is', () => {
    expect(coerceFeatureStateValue(42)).toBe(42);
    expect(coerceFeatureStateValue(0)).toBe(0);
    expect(coerceFeatureStateValue(-3.14)).toBe(-3.14);
  });

  test('returns null for NaN and Infinity', () => {
    expect(coerceFeatureStateValue(Number.NaN)).toBeNull();
    expect(coerceFeatureStateValue(Number.POSITIVE_INFINITY)).toBeNull();
    expect(coerceFeatureStateValue(Number.NEGATIVE_INFINITY)).toBeNull();
  });

  test('returns strings as-is', () => {
    expect(coerceFeatureStateValue('hello')).toBe('hello');
    expect(coerceFeatureStateValue('')).toBe('');
  });

  test('returns null for objects, arrays, booleans, and undefined', () => {
    expect(coerceFeatureStateValue({})).toBeNull();
    expect(coerceFeatureStateValue([])).toBeNull();
    expect(coerceFeatureStateValue(true)).toBeNull();
    expect(coerceFeatureStateValue(undefined)).toBeNull();
    expect(coerceFeatureStateValue(null)).toBeNull();
  });
});

describe('decodeHoverTrackedKey', () => {
  test('decodes a single entry', () => {
    const key = `layer-1${TRACKED_FIELD_SEP}src-1${TRACKED_FIELD_SEP}1`;
    const result = decodeHoverTrackedKey(key);
    expect(result).toEqual([
      { layerId: 'layer-1', sourceId: 'src-1', hasHoverPaint: true },
    ]);
  });

  test('decodes multiple entries separated by RECORD_SEP', () => {
    const key = [
      `layer-1${TRACKED_FIELD_SEP}src-1${TRACKED_FIELD_SEP}1`,
      `layer-2${TRACKED_FIELD_SEP}src-2${TRACKED_FIELD_SEP}0`,
    ].join(TRACKED_RECORD_SEP);
    const result = decodeHoverTrackedKey(key);
    expect(result).toEqual([
      { layerId: 'layer-1', sourceId: 'src-1', hasHoverPaint: true },
      { layerId: 'layer-2', sourceId: 'src-2', hasHoverPaint: false },
    ]);
  });

  test('returns single entry for empty string', () => {
    expect(decodeHoverTrackedKey('')).toEqual([
      { layerId: '', sourceId: undefined, hasHoverPaint: false },
    ]);
  });
});

describe('decodeClickTrackedKey', () => {
  test('decodes a single entry', () => {
    const key = `layer-1${TRACKED_FIELD_SEP}src-1${TRACKED_FIELD_SEP}1`;
    const result = decodeClickTrackedKey(key);
    expect(result).toEqual([
      { layerId: 'layer-1', sourceId: 'src-1', hasSelectedPaint: true },
    ]);
  });

  test('decodes multiple entries', () => {
    const key = [
      `layer-a${TRACKED_FIELD_SEP}src-a${TRACKED_FIELD_SEP}0`,
      `layer-b${TRACKED_FIELD_SEP}src-b${TRACKED_FIELD_SEP}1`,
    ].join(TRACKED_RECORD_SEP);
    const result = decodeClickTrackedKey(key);
    expect(result).toEqual([
      { layerId: 'layer-a', sourceId: 'src-a', hasSelectedPaint: false },
      { layerId: 'layer-b', sourceId: 'src-b', hasSelectedPaint: true },
    ]);
  });
});
