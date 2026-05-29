import maplibregl from 'maplibre-gl';
import * as React from 'react';

import { useGeoVis, useGeoVisClick } from './contexts';

export interface GeoVisMarkerProps {
  /** Marker accent colour passed to `maplibregl.Marker`. Defaults to `'#3FB1CE'`. */
  color?: string;
  /**
   * Custom HTML element used as the marker. When provided, `color` is ignored
   * (MapLibre only applies colour to the built-in SVG marker).
   */
  element?: HTMLElement;
  /** Pixel offset `[x, y]` applied to the marker position. */
  offset?: [number, number];
}

/**
 * Renders a MapLibre GL `Marker` pinned to the last clicked feature's
 * geographic coordinates (`lngLat`). The marker is added on click and removed
 * automatically when the click is cleared (Escape or outside click).
 *
 * Must be rendered inside `<GeoVisProvider>`.
 */
export const GeoVisMarker = ({
  color,
  element,
  offset,
}: GeoVisMarkerProps): null => {
  const { runtime } = useGeoVis();
  const click = useGeoVisClick();

  React.useEffect(() => {
    if (!runtime) return;
    const map = runtime
      .getAdapter()
      .getNativeInstance() as maplibregl.Map | null;
    if (!map) return;
    if (!click) return;

    const markerOptions: maplibregl.MarkerOptions = {};
    if (color) markerOptions.color = color;
    if (element) markerOptions.element = element;
    if (offset) markerOptions.offset = offset;

    const marker = new maplibregl.Marker(markerOptions)
      .setLngLat(click.lngLat)
      .addTo(map);

    return () => {
      marker.remove();
    };
  }, [runtime, click, color, element, offset]);

  return null;
};
