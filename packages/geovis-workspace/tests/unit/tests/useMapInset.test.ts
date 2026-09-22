/**
 * How much of the map each open sidebar is covering. What it positions — the
 * loading overlay — is covered in Layout.loading.test.tsx.
 */

import { act, renderHook } from '@ttoss/test-utils/react';
import { useMapInset } from 'src/components/useMapInset';

/** A node whose measured width is whatever the test says it is. */
const box = (width: number) => {
  return {
    current: {
      getBoundingClientRect: () => {
        return { width };
      },
    } as unknown as HTMLElement,
  };
};

/**
 * jsdom ships no ResizeObserver. The hook is written to fall back to zero
 * without one, which this replaces so the measuring path can be exercised.
 */
const installObserver = () => {
  const callbacks: (() => void)[] = [];

  (globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
    constructor(callback: () => void) {
      callbacks.push(callback);
    }
    observe() {}
    disconnect() {}
  };

  return {
    /** Reports the boxes, the way an observed resize would. */
    fire: () => {
      act(() => {
        for (const callback of callbacks) callback();
      });
    },
    restore: () => {
      delete (globalThis as { ResizeObserver?: unknown }).ResizeObserver;
    },
  };
};

const render = (args: {
  container: number;
  left: number;
  right: number;
  leftOpen: boolean;
  rightOpen: boolean;
}) => {
  const observer = installObserver();

  try {
    const rendered = renderHook(() => {
      return useMapInset({
        container: box(args.container),
        left: box(args.left),
        right: box(args.right),
        leftOpen: args.leftOpen,
        rightOpen: args.rightOpen,
      });
    });

    observer.fire();

    return rendered;
  } finally {
    observer.restore();
  }
};

describe('useMapInset', () => {
  test('reports nothing while both sidebars are closed', () => {
    const { result } = render({
      container: 1000,
      left: 340,
      right: 340,
      leftOpen: false,
      rightOpen: false,
    });

    expect(result.current).toEqual({ left: 0, right: 0 });
  });

  /*
   * A closed sidebar is translated out of view, not resized, so its box is the
   * same width either way — which is why the open flags are arguments.
   */
  test('reports only the side that is open', () => {
    const { result } = render({
      container: 1000,
      left: 340,
      right: 300,
      leftOpen: true,
      rightOpen: false,
    });

    expect(result.current).toEqual({ left: 340, right: 0 });
  });

  test('reports both when both are open', () => {
    const { result } = render({
      container: 1000,
      left: 340,
      right: 300,
      leftOpen: true,
      rightOpen: true,
    });

    expect(result.current).toEqual({ left: 340, right: 300 });
  });

  /*
   * The mobile full-screen panel: there is no remaining map to center against,
   * so nothing is reported and whatever reads this falls back to the middle of
   * the screen.
   */
  test('reports nothing for a panel as wide as the workspace', () => {
    const { result } = render({
      container: 390,
      left: 390,
      right: 390,
      leftOpen: true,
      rightOpen: true,
    });

    expect(result.current).toEqual({ left: 0, right: 0 });
  });

  test('reports nothing before the workspace has been measured', () => {
    const { result } = render({
      container: 0,
      left: 340,
      right: 0,
      leftOpen: true,
      rightOpen: false,
    });

    expect(result.current).toEqual({ left: 0, right: 0 });
  });

  /*
   * The first paint, before the refs are attached: nothing has a box yet, and
   * nothing is observed. Reported as zero rather than as NaN pushing the
   * overlay off the map.
   */
  test('reports nothing before the boxes exist', () => {
    const observer = installObserver();

    try {
      const empty = { current: null };
      const { result } = renderHook(() => {
        return useMapInset({
          container: empty,
          left: empty,
          right: empty,
          leftOpen: true,
          rightOpen: true,
        });
      });

      observer.fire();

      expect(result.current).toEqual({ left: 0, right: 0 });
    } finally {
      observer.restore();
    }
  });

  /* Without a ResizeObserver nothing is measured, and centering is unchanged. */
  test('falls back to zero where ResizeObserver is missing', () => {
    const { result } = renderHook(() => {
      return useMapInset({
        container: box(1000),
        left: box(340),
        right: box(300),
        leftOpen: true,
        rightOpen: true,
      });
    });

    expect(result.current).toEqual({ left: 0, right: 0 });
  });
});
