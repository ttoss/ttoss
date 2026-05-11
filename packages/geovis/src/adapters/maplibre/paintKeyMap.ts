import type { GeoVisGeometryType } from '../../spec/types';

// Maps spec-level camelCase paint keys to MapLibre kebab-case paint properties.
// `lineColor` is geometry-dependent: polygon uses `fill-outline-color`,
// line uses `line-color`.
const SPEC_PAINT_KEY_MAP: Record<
  string,
  string | ((g: GeoVisGeometryType) => string | undefined)
> = {
  fillColor: 'fill-color',
  fillOpacity: 'fill-opacity',
  lineColor: (g) => {
    return g === 'polygon' ? 'fill-outline-color' : 'line-color';
  },
  lineWidth: (g) => {
    return g === 'polygon' ? undefined : 'line-width';
  },
  lineOpacity: 'line-opacity',
  lineDasharray: 'line-dasharray',
  circleColor: 'circle-color',
  circleRadius: 'circle-radius',
  circleOpacity: 'circle-opacity',
  circleStrokeColor: 'circle-stroke-color',
  circleStrokeWidth: 'circle-stroke-width',
  rasterOpacity: 'raster-opacity',
  heatmapRadius: 'heatmap-radius',
  heatmapOpacity: 'heatmap-opacity',
  heatmapIntensity: 'heatmap-intensity',
  heatmapWeight: 'heatmap-weight',
  textColor: 'text-color',
  textOpacity: 'text-opacity',
  textHaloColor: 'text-halo-color',
  textHaloWidth: 'text-halo-width',
  iconColor: 'icon-color',
  iconOpacity: 'icon-opacity',
};

/**
 * Translates a GeoVis camelCase paint key to the MapLibre kebab-case property
 * name for the given geometry type. Returns `undefined` when the key has no
 * MapLibre counterpart for that geometry (e.g. `lineWidth` on a polygon).
 */
export const specPaintKeyToMaplibre = (
  key: string,
  geometry: GeoVisGeometryType
): string | undefined => {
  const entry = SPEC_PAINT_KEY_MAP[key];
  if (!entry) return undefined;
  return typeof entry === 'function' ? entry(geometry) : entry;
};
