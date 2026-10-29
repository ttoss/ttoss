import { resolveHeatmapColors } from '../../spec/heatmap';
import type { HeatmapPaint, ZoomScaled } from '../../spec/types';

/**
 * A {@link ZoomScaled} value as MapLibre reads it: the number itself, or a
 * linear `interpolate` over the zoom between its stops.
 *
 * @example
 * toZoomExpression([[10, 6], [16, 40]]);
 * // ['interpolate', ['linear'], ['zoom'], 10, 6, 16, 40]
 */
export const toZoomExpression = (value: ZoomScaled): number | unknown[] => {
  if (!Array.isArray(value)) return value;
  return ['interpolate', ['linear'], ['zoom'], ...value.flat()];
};

/**
 * `heatmap-weight`: the number itself, or a property read linearly from `0`
 * (no weight) to `max` (a full point) — clamped there by `interpolate`, and
 * `0` for a missing or non-numeric value.
 */
export const toHeatmapWeight = (
  weight: HeatmapPaint['heatmapWeight']
): number | unknown[] => {
  if (weight === undefined) return 1;
  if (typeof weight === 'number') return weight;
  return [
    'interpolate',
    ['linear'],
    ['to-number', ['get', weight.property], 0],
    0,
    0,
    weight.max,
    1,
  ];
};

/**
 * `heatmap-color`: transparent at zero density, then the colours spread
 * evenly up to full density — the first one already at the lowest density
 * drawn, so the fringe of the heat shows the ramp's coolest colour. The
 * transparent stop interpolates without a grey halo because MapLibre blends
 * colours premultiplied.
 *
 * @returns The expression, or `undefined` to leave MapLibre's own ramp.
 */
export const toHeatmapColor = (
  colors: HeatmapPaint['heatmapColors']
): unknown[] | undefined => {
  const ramp = resolveHeatmapColors(colors);
  if (!ramp) return undefined;
  const stops = ramp.flatMap((color, index) => {
    return [(index + 1) / ramp.length, color];
  });
  return [
    'interpolate',
    ['linear'],
    ['heatmap-density'],
    0,
    'rgba(0,0,0,0)',
    ...stops,
  ];
};

/** The MapLibre `heatmap` paint for a GeoVis heatmap layer's `paint`. */
export const buildHeatmapPaint = (
  hp: HeatmapPaint
): Record<string, unknown> => {
  return {
    'heatmap-radius': toZoomExpression(hp.heatmapRadius ?? 15),
    'heatmap-opacity': toZoomExpression(hp.heatmapOpacity ?? 1),
    'heatmap-intensity': toZoomExpression(hp.heatmapIntensity ?? 1),
    'heatmap-weight': toHeatmapWeight(hp.heatmapWeight),
    'heatmap-color': toHeatmapColor(hp.heatmapColors),
  };
};
