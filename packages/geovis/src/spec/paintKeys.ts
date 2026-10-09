import type {
  CirclePaint,
  FillPaint,
  GeoVisGeometryType,
  HeatmapPaint,
  LinePaint,
  RasterPaint,
  SymbolPaint,
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
