import type { GeoVisGeometryType, VisualizationLayer } from '../../spec/types';

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
  circleStrokeOpacity: 'circle-stroke-opacity',
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

// An extruded polygon (`layer.extrusion`) is a `fill-extrusion` layer: its
// fill keys move to the extrusion's, and its outline has no counterpart.
const EXTRUDED_PAINT_KEY_MAP: Record<string, string | undefined> = {
  'fill-color': 'fill-extrusion-color',
  'fill-opacity': 'fill-extrusion-opacity',
  'fill-outline-color': undefined,
};

/**
 * Translates a GeoVis camelCase paint key to the MapLibre kebab-case property
 * name for the given layer. Returns `undefined` when the key has no MapLibre
 * counterpart for that layer (e.g. `lineWidth` on a polygon, `lineColor` on an
 * extruded one).
 */
export const specPaintKeyToMaplibre = (
  key: string,
  layer: Pick<VisualizationLayer, 'geometry' | 'extrusion'>
): string | undefined => {
  const entry = SPEC_PAINT_KEY_MAP[key];
  if (!entry) return undefined;
  const property = typeof entry === 'function' ? entry(layer.geometry) : entry;
  if (
    property !== undefined &&
    layer.geometry === 'polygon' &&
    layer.extrusion !== undefined &&
    property in EXTRUDED_PAINT_KEY_MAP
  ) {
    return EXTRUDED_PAINT_KEY_MAP[property];
  }
  return property;
};
