import { SEQUENTIAL_PALETTES } from './mapTypeDefaults/palettes';
import type {
  HeatmapPaint,
  HeatmapPaletteName,
  LegendSpec,
  VisualizationLayer,
  VisualizationSpec,
} from './types';

/**
 * The ramp MapLibre draws a heatmap in when `heatmap-color` is unset, past
 * its transparent zero: kept here so a density legend for a layer that
 * declares no `heatmapColors` shows the colours the map actually draws.
 */
export const MAPLIBRE_HEATMAP_COLORS: ReadonlyArray<string> = [
  'royalblue',
  'cyan',
  'lime',
  'yellow',
  'red',
];

/** The palette names `heatmapColors` accepts. */
export const HEATMAP_PALETTE_NAMES = Object.keys(
  SEQUENTIAL_PALETTES
) as HeatmapPaletteName[];

/**
 * Whether `value` names a palette `heatmapColors` accepts.
 *
 * @example
 * isHeatmapPaletteName('red'); // true
 * isHeatmapPaletteName('rainbow'); // false
 */
export const isHeatmapPaletteName = (
  value: unknown
): value is HeatmapPaletteName => {
  return (
    typeof value === 'string' &&
    (HEATMAP_PALETTE_NAMES as string[]).includes(value)
  );
};

/**
 * The colours of a heatmap's density ramp, lowest density first: the named
 * palette's, the listed ones, or `undefined` when the layer declares none (or
 * an unknown palette name) and MapLibre's own ramp is drawn.
 *
 * @example
 * resolveHeatmapColors(['#fde68a', '#dc2626']); // ['#fde68a', '#dc2626']
 * resolveHeatmapColors(undefined); // undefined
 */
export const resolveHeatmapColors = (
  colors: HeatmapPaint['heatmapColors']
): string[] | undefined => {
  if (Array.isArray(colors)) return colors.length > 0 ? colors : undefined;
  if (isHeatmapPaletteName(colors)) return [...SEQUENTIAL_PALETTES[colors]];
  return undefined;
};

/**
 * The heatmap layer a density legend describes: the first one that points
 * at it through `activeLegendId`, or that declares it in its own `legends`.
 */
export const findHeatmapLayerForLegend = (
  spec: VisualizationSpec,
  legend: LegendSpec
): VisualizationLayer | undefined => {
  return spec.layers.find((layer) => {
    return (
      layer.geometry === 'heatmap' &&
      (layer.activeLegendId === legend.id ||
        layer.legends?.some((own) => {
          return own.id === legend.id;
        }) === true)
    );
  });
};

/**
 * The colours a density legend's gradient shows, lowest density first: those
 * of the heatmap layer it describes, so the legend never drifts from the map.
 *
 * @returns The ramp, or `undefined` when the legend is not a density legend
 * or no heatmap layer refers to it.
 *
 * @example
 * resolveDensityLegendColors(spec, { id: 'crashes', colorBy: { type: 'density' } });
 * // ['#fde68a', '#f97316', '#dc2626']
 */
export const resolveDensityLegendColors = (
  spec: VisualizationSpec,
  legend: LegendSpec
): string[] | undefined => {
  if (legend.colorBy?.type !== 'density') return undefined;
  const layer = findHeatmapLayerForLegend(spec, legend);
  if (!layer) return undefined;
  const paint = (layer.paint ?? {}) as HeatmapPaint;
  return (
    resolveHeatmapColors(paint.heatmapColors) ?? [...MAPLIBRE_HEATMAP_COLORS]
  );
};
