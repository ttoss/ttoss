/**
 * @jest-environment jsdom
 */

import { act, renderHook } from '@testing-library/react';
import {
  deriveSplitSideSpec,
  splitOptions,
  useGeoVisMapMode,
  useMapModeState,
} from 'src/react/mapMode';
import type { CameraView } from 'src/runtime/adapter';
import type { GeoVisRuntime } from 'src/runtime/createRuntime';
import type { LayerControlItem, VisualizationSpec } from 'src/spec/types';

const legend = (id: string) => {
  return {
    id,
    position: 'bottom-right' as const,
    colorBy: { type: 'categorical' as const, property: 'x', categories: [] },
  };
};

const ubs: LayerControlItem = { id: 'ubs', label: 'UBS', layers: ['ubs-pts'] };
const parks: LayerControlItem = {
  id: 'parks',
  label: 'Parques',
  layers: ['parks-pts'],
};
const missing: LayerControlItem = {
  id: 'missing',
  label: 'Ausente',
  layers: ['nowhere'],
};

const spec: VisualizationSpec = {
  engine: 'maplibre',
  view: { center: [0, 0], zoom: 3 },
  sources: [],
  legends: [legend('shared')],
  layers: [
    {
      id: 'areas',
      sourceId: 's',
      geometry: 'polygon',
      legends: [legend('areas')],
    },
    {
      id: 'ubs-pts',
      sourceId: 's',
      geometry: 'point',
      legends: [legend('ubs')],
    },
    { id: 'parks-pts', sourceId: 's', geometry: 'point', visible: false },
  ],
  control: {
    id: 'layers',
    items: [ubs, { id: 'leisure', label: 'Lazer', items: [parks] }, missing],
  },
  mapModeControl: true,
};

const camera: CameraView = {
  viewId: 'default',
  center: [-46.6, -23.5],
  zoom: 9,
  pitch: 20,
  bearing: 10,
};

describe('splitOptions', () => {
  test('offers every toggle with a layer in the spec, categories flattened', () => {
    expect(
      splitOptions(spec).map((item) => {
        return item.id;
      })
    ).toEqual(['ubs', 'parks']);
  });

  test('offers nothing without a control', () => {
    expect(splitOptions({ ...spec, control: undefined })).toEqual([]);
  });
});

describe('deriveSplitSideSpec', () => {
  const layer = (side: VisualizationSpec, id: string) => {
    return side.layers.find((entry) => {
      return entry.id === id;
    });
  };

  test("shows only the chosen item's layers, keeps the others, drops the control", () => {
    const side = deriveSplitSideSpec({
      spec,
      item: parks,
      camera: null,
      primary: true,
    });

    expect(layer(side, 'parks-pts')?.visible).toBe(true);
    expect(layer(side, 'ubs-pts')).toMatchObject({
      visible: false,
      legends: undefined,
    });
    expect(layer(side, 'areas')?.legends?.[0].position).toBe('bottom-right');
    expect(side.control).toBeUndefined();
    expect(side.mapModeControl).toBeUndefined();
    expect(side.navigationControlEnabled).toBeUndefined();
    expect(side.view).toBe(spec.view);
  });

  test('a side without an item hides every control layer', () => {
    const side = deriveSplitSideSpec({
      spec,
      item: null,
      camera: null,
      primary: true,
    });

    expect(layer(side, 'ubs-pts')?.visible).toBe(false);
    expect(layer(side, 'parks-pts')?.visible).toBe(false);
    expect(layer(side, 'areas')?.visible).toBeUndefined();
  });

  test('the other side unpositions its legends and drops the navigation control', () => {
    const side = deriveSplitSideSpec({
      spec,
      item: ubs,
      camera,
      primary: false,
    });

    expect(side.navigationControlEnabled).toBe(false);
    expect(side.legends?.[0]).not.toHaveProperty('position');
    expect(layer(side, 'areas')?.legends?.[0]).not.toHaveProperty('position');
    expect(layer(side, 'ubs-pts')?.legends?.[0]).not.toHaveProperty('position');
    expect(side.view).toMatchObject({
      center: [-46.6, -23.5],
      zoom: 9,
      pitch: 20,
      bearing: 10,
    });
  });
});

/** A runtime double: records `setView`, and lets the test report cameras. */
const fakeRuntime = () => {
  const listeners = new Set<(camera: CameraView) => void>();
  const runtime = {
    onViewChange: jest.fn((listener: (camera: CameraView) => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }),
    setView: jest.fn(),
  };
  return {
    runtime: runtime as unknown as GeoVisRuntime,
    setView: runtime.setView,
    report: (next: CameraView) => {
      for (const listener of listeners) listener(next);
    },
  };
};

describe('useMapModeState', () => {
  test('is disabled without the opt-in or without two items to split', () => {
    const optedOut = renderHook(() => {
      return useMapModeState({
        runtime: null,
        spec: { ...spec, mapModeControl: undefined },
      });
    });
    const tooFew = renderHook(() => {
      return useMapModeState({
        runtime: null,
        spec: {
          ...spec,
          control: { id: 'layers', items: [ubs] },
        },
      });
    });

    expect(optedOut.result.current.enabled).toBe(false);
    expect(tooFew.result.current.enabled).toBe(false);
  });

  test('opens the split on the item switched on, the right side empty', () => {
    const { result } = renderHook(() => {
      return useMapModeState({ runtime: null, spec });
    });

    act(() => {
      result.current.setMode('split');
    });

    expect(result.current.mode).toBe('split');
    expect(result.current.sides).toEqual({ a: 'ubs', b: null });
  });

  test('opens on the sides it is handed, as a shared link does', () => {
    const { result } = renderHook(() => {
      return useMapModeState({ runtime: null, spec });
    });

    act(() => {
      result.current.setMode('split', { a: 'parks', b: 'ubs' });
    });

    expect(result.current.sides).toEqual({ a: 'parks', b: 'ubs' });
  });

  test('a side can be changed or emptied, and an unknown id reads as none', () => {
    const { result } = renderHook(() => {
      return useMapModeState({ runtime: null, spec });
    });

    act(() => {
      result.current.setMode('split');
      result.current.setSide('b', 'parks');
    });
    expect(result.current.sides.b).toBe('parks');

    act(() => {
      result.current.setSide('a', 'not-an-item');
      result.current.setSide('b', null);
    });
    expect(result.current.sides).toEqual({ a: null, b: null });
  });

  test("tracks the map's camera and hands it back to the single map", () => {
    const { runtime, setView, report } = fakeRuntime();
    const { result } = renderHook(() => {
      return useMapModeState({ runtime, spec });
    });

    act(() => {
      report(camera);
    });
    expect(result.current.getCamera()).toBe(camera);

    const moved = { ...camera, zoom: 12 };
    act(() => {
      result.current.setMode('split');
      result.current.recordCamera(moved);
    });
    act(() => {
      result.current.setMode('single');
    });

    expect(result.current.mode).toBe('single');
    expect(setView).toHaveBeenCalledWith({
      center: moved.center,
      zoom: 12,
      pitch: moved.pitch,
      bearing: moved.bearing,
      animate: false,
    });
  });

  test('switching to the mode it is in changes nothing', () => {
    const { runtime, setView } = fakeRuntime();
    const { result } = renderHook(() => {
      return useMapModeState({ runtime, spec });
    });

    act(() => {
      result.current.setMode('single');
    });

    expect(setView).not.toHaveBeenCalled();
  });
});

describe('useGeoVisMapMode', () => {
  test('outside a provider reads a single map whose setters do nothing', () => {
    const { result } = renderHook(() => {
      return useGeoVisMapMode();
    });

    act(() => {
      result.current.setMode('split');
      result.current.setSide('a', 'ubs');
      result.current.recordCamera(camera);
    });

    expect(result.current).toMatchObject({
      enabled: false,
      mode: 'single',
      sides: { a: null, b: null },
    });
    expect(result.current.getCamera()).toBeNull();
  });
});
