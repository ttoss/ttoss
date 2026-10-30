import type {
  CirclePaint,
  FillPaint,
  GeoVisGeometryType,
  HeatmapPaint,
  LinePaint,
  RasterPaint,
  SymbolPaint,
  VisualizationLayer,
} from './types';

/*
 * The `paint` keys each layer geometry accepts — its paint type's keys, and
 * nothing else. Written as records over `keyof` so the compiler holds them to
 * the types: a key added to a paint type and left out here, or listed here and
 * missing from the type, fails the build instead of drifting silently.
 */

const FILL: Record<keyof FillPaint, true> = {
  fillColor: true,
  fillOpacity: true,
  lineColor: true,
};

const LINE: Record<keyof LinePaint, true> = {
  lineColor: true,
  lineWidth: true,
  lineOpacity: true,
  lineDasharray: true,
};

const CIRCLE: Record<keyof CirclePaint, true> = {
  circleColor: true,
  circleRadius: true,
  circleOpacity: true,
  circleStrokeColor: true,
  circleStrokeOpacity: true,
  circleStrokeWidth: true,
};

const RASTER: Record<keyof RasterPaint, true> = {
  rasterOpacity: true,
};

const HEATMAP: Record<keyof HeatmapPaint, true> = {
  heatmapRadius: true,
  heatmapOpacity: true,
  heatmapIntensity: true,
  heatmapWeight: true,
  heatmapColors: true,
};

const SYMBOL: Record<keyof SymbolPaint, true> = {
  textColor: true,
  textOpacity: true,
  textHaloColor: true,
  textHaloWidth: true,
  iconColor: true,
  iconOpacity: true,
  textField: true,
  textSize: true,
  textFont: true,
  iconImage: true,
  iconSize: true,
  iconAnchor: true,
  iconOffset: true,
  iconAllowOverlap: true,
};

/**
 * The `paint` keys a layer of each geometry accepts. Validation rejects any
 * other key rather than letting the adapter drop it at render time.
 *
 * @example
 * PAINT_KEYS.polygon; // ['fillColor', 'fillOpacity', 'lineColor']
 */
export const PAINT_KEYS: Record<GeoVisGeometryType, ReadonlyArray<string>> = {
  polygon: Object.keys(FILL),
  line: Object.keys(LINE),
  point: Object.keys(CIRCLE),
  raster: Object.keys(RASTER),
  heatmap: Object.keys(HEATMAP),
  symbol: Object.keys(SYMBOL),
};

/**
 * The `paint` keys one layer accepts. An extruded polygon (`extrusion` set) is
 * a prism with no outline, so its `lineColor` has no counterpart and is not
 * accepted. The extrusion test mirrors `isExtrudedLayer` in
 * `adapters/maplibre/layerTranslation.ts`; kept here because `spec/` must not
 * import the adapter. Keep the two in step.
 *
 * @example
 * paintKeysFor({ geometry: 'polygon', extrusion: {} }); // ['fillColor', 'fillOpacity']
 */
export const paintKeysFor = (
  layer: Pick<VisualizationLayer, 'geometry' | 'extrusion'>
): ReadonlyArray<string> => {
  if (layer.geometry === 'polygon' && layer.extrusion !== undefined) {
    return PAINT_KEYS.polygon.filter((key) => {
      return key !== 'lineColor';
    });
  }
  return PAINT_KEYS[layer.geometry];
};
