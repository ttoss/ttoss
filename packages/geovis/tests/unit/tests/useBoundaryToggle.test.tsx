/**
 * @jest-environment jsdom
 *
 * Tests for useBoundaryToggle — a pure React state hook that appends boundary
 * groups to a VisualizationSpec and manages per-group visibility toggles.
 *
 * No GeoVisProvider or MapLibre mocks are required because the hook does not
 * interact with the map runtime — it is a pure spec transformation hook.
 */

import { act, renderHook } from '@testing-library/react';
import { useBoundaryToggle } from 'src/react/useBoundaryToggle';
import type { BoundaryGroup } from 'src/spec/presets';
import {
  BRAZIL_MUNICIPALITY_OUTLINES,
  BRAZIL_STATE_OUTLINES,
} from 'src/spec/presets';
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

const statesGroup = BRAZIL_STATE_OUTLINES.local;
const municipalitiesGroup = BRAZIL_MUNICIPALITY_OUTLINES.local;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useBoundaryToggle', () => {
  // 1. Canonical happy path — initial state proves the hook exists and appends
  //    all groups to the spec. Every group starts visible.
  test('initial state: all groups visible, spec includes sources and layers from every group', () => {
    const { result } = renderHook(() => {
      return useBoundaryToggle(emptySpec, [statesGroup, municipalitiesGroup]);
    });

    // Visibility
    expect(result.current.isVisible(statesGroup)).toBe(true);
    expect(result.current.isVisible(municipalitiesGroup)).toBe(true);

    // Spec shape — sources and layers from both groups are present
    expect(result.current.spec.sources).toHaveLength(2);
    expect(result.current.spec.layers).toHaveLength(2);

    // By default no layer has visible:false set
    expect(result.current.spec.layers[0].visible).toBeUndefined();
    expect(result.current.spec.layers[1].visible).toBeUndefined();
  });

  // 2. Core toggle behavior — inverting a single group's visibility.
  //    toggle() hides then shows; isVisible() reflects the change.
  test('toggle hides then shows a single group', () => {
    const { result } = renderHook(() => {
      return useBoundaryToggle(emptySpec, [statesGroup]);
    });

    // Hide
    act(() => {
      result.current.toggle(statesGroup);
    });
    expect(result.current.isVisible(statesGroup)).toBe(false);

    // Show again
    act(() => {
      result.current.toggle(statesGroup);
    });
    expect(result.current.isVisible(statesGroup)).toBe(true);
  });

  // 3. Multiple groups must be independently toggleable — hiding one must not
  //    affect the other.
  test('multiple groups are independently toggleable', () => {
    const { result } = renderHook(() => {
      return useBoundaryToggle(emptySpec, [statesGroup, municipalitiesGroup]);
    });

    // Hide only states
    act(() => {
      result.current.toggle(statesGroup);
    });
    expect(result.current.isVisible(statesGroup)).toBe(false);
    expect(result.current.isVisible(municipalitiesGroup)).toBe(true);

    // Hide both
    act(() => {
      result.current.toggle(municipalitiesGroup);
    });
    expect(result.current.isVisible(statesGroup)).toBe(false);
    expect(result.current.isVisible(municipalitiesGroup)).toBe(false);

    // Show states back — municipalities stays hidden
    act(() => {
      result.current.toggle(statesGroup);
    });
    expect(result.current.isVisible(statesGroup)).toBe(true);
    expect(result.current.isVisible(municipalitiesGroup)).toBe(false);
  });

  // 4. Edge case — empty groups list. The hook should return a spec identical
  //    to the input and provide stable toggle/isVisible function references.
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

  // 5. Reference stability — toggle and isVisible must be referentially stable
  //    across re-renders when the inputs have not changed.
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

    // Re-render with the exact same references
    rerender({ spec: emptySpec, groups });

    expect(result.current.toggle).toBe(firstToggle);
    expect(result.current.isVisible).toBe(firstIsVisible);
  });
});
