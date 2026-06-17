/**
 * @jest-environment jsdom
 *
 * Tests for useBoundaryToggle — a pure React state hook that appends boundary
 * groups to a VisualizationSpec and manages per-group visibility toggles.
 */

import { act, renderHook } from '@testing-library/react';
import { useBoundaryToggle } from 'src/react/useBoundaryToggle';
import type { BoundaryGroup } from 'src/spec/boundaryGroup';
import { createBoundaryGroup } from 'src/spec/boundaryGroup';
import type { VisualizationSpec } from 'src/spec/types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const emptySpec: VisualizationSpec = {
  id: 'test',
  engine: 'maplibre',
  sources: [],
  layers: [],
};

const statesGroup = createBoundaryGroup({
  id: 'brazil-states',
  data: 'https://example.com/estados.geojson',
  paint: { lineColor: '#374151', lineWidth: 1.5 },
});

const municipalitiesGroup = createBoundaryGroup({
  id: 'brazil-municipalities',
  data: 'https://example.com/distritos.geojson',
  paint: { lineColor: '#d1d5db', lineWidth: 0.5 },
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useBoundaryToggle', () => {
  test('initial state: all groups visible, spec includes sources and layers from every group', () => {
    const { result } = renderHook(() => {
      return useBoundaryToggle(emptySpec, [statesGroup, municipalitiesGroup]);
    });

    expect(result.current.isVisible(statesGroup)).toBe(true);
    expect(result.current.isVisible(municipalitiesGroup)).toBe(true);

    expect(result.current.spec.sources).toHaveLength(2);
    expect(result.current.spec.layers).toHaveLength(2);

    expect(result.current.spec.layers[0].visible).toBeUndefined();
    expect(result.current.spec.layers[1].visible).toBeUndefined();
  });

  test('toggle hides then shows a single group', () => {
    const { result } = renderHook(() => {
      return useBoundaryToggle(emptySpec, [statesGroup]);
    });

    act(() => {
      result.current.toggle(statesGroup);
    });
    expect(result.current.isVisible(statesGroup)).toBe(false);

    act(() => {
      result.current.toggle(statesGroup);
    });
    expect(result.current.isVisible(statesGroup)).toBe(true);
  });

  test('multiple groups are independently toggleable', () => {
    const { result } = renderHook(() => {
      return useBoundaryToggle(emptySpec, [statesGroup, municipalitiesGroup]);
    });

    act(() => {
      result.current.toggle(statesGroup);
    });
    expect(result.current.isVisible(statesGroup)).toBe(false);
    expect(result.current.isVisible(municipalitiesGroup)).toBe(true);

    act(() => {
      result.current.toggle(municipalitiesGroup);
    });
    expect(result.current.isVisible(statesGroup)).toBe(false);
    expect(result.current.isVisible(municipalitiesGroup)).toBe(false);

    act(() => {
      result.current.toggle(statesGroup);
    });
    expect(result.current.isVisible(statesGroup)).toBe(true);
    expect(result.current.isVisible(municipalitiesGroup)).toBe(false);
  });

  test('empty groups list returns spec unchanged and does not crash', () => {
    const { result } = renderHook(() => {
      return useBoundaryToggle(emptySpec, []);
    });

    expect(result.current.spec.sources).toHaveLength(0);
    expect(result.current.spec.layers).toHaveLength(0);
    expect(result.current.spec).toEqual(emptySpec);
    expect(typeof result.current.toggle).toBe('function');
    expect(typeof result.current.isVisible).toBe('function');
  });

  test('toggle and isVisible function references are stable across re-renders with identical props', () => {
    const groups: ReadonlyArray<BoundaryGroup> = [statesGroup];

    const { result, rerender } = renderHook(
      (props: {
        spec: VisualizationSpec;
        groups: ReadonlyArray<BoundaryGroup>;
      }) => {
        return useBoundaryToggle(props.spec, props.groups);
      },
      { initialProps: { spec: emptySpec, groups } }
    );

    const firstToggle = result.current.toggle;
    const firstIsVisible = result.current.isVisible;

    rerender({ spec: emptySpec, groups });

    expect(result.current.toggle).toBe(firstToggle);
    expect(result.current.isVisible).toBe(firstIsVisible);
  });
});
