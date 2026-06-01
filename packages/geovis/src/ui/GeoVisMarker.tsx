import maplibregl from 'maplibre-gl';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { useGeoVis, useGeoVisClick } from './contexts';

export interface GeoVisMarkerProps {
  /** Marker accent colour passed to `maplibregl.Marker`. Only used when neither `children` nor `element` is provided. */
  color?: string;
  /**
   * Pre-existing HTML element used as the marker. When provided, `color` is
   * ignored. Incompatible with `children` — if both are given, `children` wins.
   */
  element?: HTMLElement;
  /** Pixel offset `[x, y]` applied to the marker position. */
  offset?: [number, number];
  /**
   * React content rendered inside the marker container. When provided, a `div`
   * container is created and passed to `maplibregl.Marker` as the custom
   * element. `color` and `element` props are ignored.
   */
  children?: React.ReactNode;
  /** CSS class applied to the React children wrapper inside the marker container. */
  className?: string;
}

/**
 * Renders a MapLibre GL `Marker` pinned to the last clicked feature's
 * geographic coordinates (`lngLat`). The marker is added on click and removed
 * automatically when the click is cleared (Escape or outside click).
 *
 * Supports three rendering modes:
 * - **children** — arbitrary React JSX rendered inside a container div
 * - **element** — pre-existing `HTMLElement` passed directly to MapLibre
 * - **color** — built-in SVG pin tinted with the given colour
 *
 * Must be rendered inside `<GeoVisProvider>`.
 */
export const GeoVisMarker = ({
  color,
  element,
  offset,
  children,
  className,
}: GeoVisMarkerProps): React.ReactPortal | null => {
  const { runtime } = useGeoVis();
  const click = useGeoVisClick();

  // Container div for React-children mode. Created once on mount via useState
  // factory so the same node is passed to maplibregl.Marker across re-renders.
  // State (not ref) is used to avoid reading `.current` during render, which
  // violates the react-hooks/refs rule introduced in React 19.
  const [container] = React.useState<HTMLDivElement | null>(() => {
    if (typeof document !== 'undefined') {
      return document.createElement('div');
    }
    return null;
  });

  React.useEffect(() => {
    // SSR guard — effect should only run in browser environment
    if (typeof document === 'undefined') return;

    if (!runtime || !click) return;

    const map = runtime
      .getAdapter()
      .getNativeInstance() as maplibregl.Map | null;
    if (!map) return;

    const markerOptions: maplibregl.MarkerOptions = {};
    if (children !== undefined && container) {
      markerOptions.element = container;
    } else if (element) {
      markerOptions.element = element;
    } else if (color) {
      markerOptions.color = color;
    }
    if (offset) markerOptions.offset = offset;

    const marker = new maplibregl.Marker(markerOptions)
      .setLngLat(click.lngLat)
      .addTo(map);

    return () => {
      marker.remove();
    };
  }, [runtime, click, color, element, offset, children, container]);

  if (children !== undefined && container) {
    // className is applied on a React-managed wrapper div inside the container,
    // so the DOM structure is: [MapLibre marker] > [container] > [.className wrapper] > children.
    return ReactDOM.createPortal(
      <div className={className}>{children}</div>,
      container
    );
  }
  return null;
};
