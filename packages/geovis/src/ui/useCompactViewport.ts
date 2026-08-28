import * as React from 'react';

/**
 * Viewport width below which the map's corner overlays collapse into a compact
 * control bar: the legend stops floating as a card and becomes a button next to
 * the layer-control trigger.
 */
export const COMPACT_BREAKPOINT_PX = 640;

// `max-width` is inclusive, so subtract a hair to make 640px itself the first
// roomy width — matching how a `min-width: 640px` breakpoint would read.
const QUERY = `(max-width: ${COMPACT_BREAKPOINT_PX - 0.02}px)`;

const supportsMatchMedia = () => {
  return (
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
  );
};

const subscribe = (onStoreChange: () => void) => {
  if (!supportsMatchMedia()) {
    return () => {};
  }
  const list = window.matchMedia(QUERY);
  list.addEventListener('change', onStoreChange);
  return () => {
    list.removeEventListener('change', onStoreChange);
  };
};

const getSnapshot = () => {
  if (!supportsMatchMedia()) {
    return false;
  }
  return window.matchMedia(QUERY).matches;
};

/**
 * Server snapshot: SSR has no viewport, so it renders the roomy layout. The
 * client re-reads the real width on hydration and collapses if needed.
 */
const getServerSnapshot = () => {
  return false;
};

/**
 * Whether the viewport is narrower than {@link COMPACT_BREAKPOINT_PX}.
 *
 * Backed by `useSyncExternalStore` so the value stays consistent across a
 * concurrent render and updates on every resize that crosses the breakpoint.
 * Returns `false` where `matchMedia` is unavailable (SSR, older test
 * environments), which keeps the existing desktop overlays as the default.
 *
 * @returns `true` while the viewport is below the compact breakpoint.
 *
 * @example
 * const isCompact = useCompactViewport();
 * // 375px viewport → true; 1024px → false
 */
export const useCompactViewport = (): boolean => {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
};
