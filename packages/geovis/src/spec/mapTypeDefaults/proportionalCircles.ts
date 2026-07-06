import type {
  LegendSpec,
  MapData,
  MapDataRow,
  VisualizationLayer,
  VisualizationSpec,
} from '../types';
import { DEFAULT_DOT_DENSITY_PAINT } from './dotDensity';
import { DEFAULT_SEQUENTIAL_PALETTE } from './palettes';
import {
  computeJenksBreaks,
  computeNumClasses,
  findMatchSourceId,
  inspectDataValues,
  niceCeil,
  pickPaletteColors,
} from './utils';

/**
 * Default paint values for proportionalCircles. To override, add a layer to
 * `spec.layers` with the same `sourceId` and `geometry: 'point'` — its `paint`
 * is merged over these defaults by `injectResolvedFields`/`mergeResolvedLayers`
 * in `mapTypeDefaults.ts`.
 */
export const PROPORTIONAL_CIRCLES_DEFAULTS = {
  minRadiusPx: 4,
  maxRadiusPx: 16,
  zeroRadiusPx: 0,
  circleOpacity: 0.72,
  strokeWidth: 0.5,
  strokeOpacity: 0.9,
} as const;

/**
 * Deterministic id of the auto-generated proportionalCircles legend
 * (`<mapData[0].mapDataId>-legend`). Exported so the legend UI can recognise
 * the resolver's own legend without a marker field on `LegendSpec` — e.g. to
 * suppress it when `legendEnabled: false` while leaving user-authored legends
 * untouched.
 */
export const getProportionalCirclesAutoLegendId = (
  spec: VisualizationSpec
): string => {
  return `${spec.mapData?.[0]?.mapDataId ?? 'unknown'}-legend`;
};

/**
 * Builds a quantitative color-by using Jenks natural breaks from the
 * first mapData entry's numeric values. Falls back to a single-bin
 * palette when data is insufficient for meaningful breaks.
 *
 * Circle-based mapTypes (`dotDensity`/`proportionalCircles`) paint EVERY
 * circle — any size, any bin — with `DEFAULT_DOT_DENSITY_PAINT.circleColor`,
 * regardless of the classification method: the thresholds still describe the
 * bins, but every bin (and the below-first-threshold default) maps to the
 * same flat color. Other mapTypes keep the sequential palette.
 */
const buildColorBy = (
  mapDataEntry: MapData | undefined,
  spec: VisualizationSpec
) => {
  const { isNumeric, numericValues } = inspectDataValues(
    mapDataEntry?.data ?? []
  );

  const isCircleMapType =
    spec.mapType === 'dotDensity' || spec.mapType === 'proportionalCircles';

  const colorsFor = (binCount: number): string[] => {
    if (isCircleMapType) {
      return Array.from({ length: binCount }, () => {
        return DEFAULT_DOT_DENSITY_PAINT.circleColor;
      });
    }
    return pickPaletteColors(DEFAULT_SEQUENTIAL_PALETTE, binCount);
  };
  const defaultColor = isCircleMapType
    ? DEFAULT_DOT_DENSITY_PAINT.circleColor
    : (DEFAULT_SEQUENTIAL_PALETTE[0] ?? '#dbeafe');

  if (isNumeric && numericValues.length > 1) {
    const uniqueCount = new Set(numericValues).size;
    const numClasses = computeNumClasses(uniqueCount);
    // Jenks breaks land on raw data values (e.g. 7, 23, 61); round each one
    // up to a nice cartographic number so the bins read as 10/25/100-style
    // thresholds. `niceCeil` is monotonic, so the mapped list stays ascending;
    // rounding can collapse neighbouring breaks, so dedupe (and drop the `0`
    // that `niceCeil` returns for non-positive breaks) to keep the threshold
    // list strictly ascending.
    const breaks = [
      ...new Set(computeJenksBreaks(numericValues, numClasses).map(niceCeil)),
    ].filter((breakValue) => {
      return breakValue > 0;
    });
    return {
      type: 'quantitative' as const,
      property: 'value',
      scale: 'threshold' as const,
      thresholds: breaks,
      colors: colorsFor(breaks.length + 1),
      defaultColor,
    };
  }

  return {
    type: 'quantitative' as const,
    property: 'value',
    scale: 'threshold' as const,
    thresholds: [],
    colors: colorsFor(1),
    defaultColor,
  };
};

/**
 * Finds the first suitable size entry from `spec.mapData`.
 *
 * Prefers an entry with `dimension: 'size'`; falls back to the first entry
 * only when it contains numeric data (non-numeric entries like categorical
 * color data are skipped).
 */
const findSizeFromMapData = (spec: VisualizationSpec): MapData | undefined => {
  const data = spec.mapData;
  if (!data?.length) return undefined;

  const explicitSize = data.find((m) => {
    return m.dimension === 'size';
  });
  if (explicitSize) return explicitSize;

  const first = data[0];
  const { isNumeric } = inspectDataValues(first?.data ?? []);
  return isNumeric ? first : undefined;
};

/**
 * Extracts size values from a layer's `propertyName` via inline GeoJSON.
 * Returns a synthetic `MapDataRow[]` entry, or `undefined` when no
 * `propertyName` layer with inline data is available.
 */
const findSizeFromPropertyName = (
  spec: VisualizationSpec
): MapData | undefined => {
  const propLayer = spec.layers?.find((l) => {
    return l.propertyName;
  });
  if (!propLayer) return undefined;

  const source = spec.sources.find((s) => {
    return s.id === propLayer.sourceId && s.type === 'geojson';
  }) as
    | {
        type: 'geojson';
        data: { features?: Array<{ properties?: Record<string, unknown> }> };
      }
    | undefined;
  if (!source?.data?.features) return undefined;

  const values: MapDataRow[] = source.data.features.map((f) => {
    return {
      geometryId: '',
      value: (f.properties?.[propLayer.propertyName!] as number) ?? 0,
    };
  });

  return { data: values } as unknown as MapData;
};

/**
 * Selects the mapData entry that drives circle SIZE. Resolution order:
 *
 * 1. A `mapData` entry with `dimension: 'size'` (or the first numeric entry).
 * 2. A layer's `propertyName` — values are extracted from the matching
 *    inline GeoJSON source's `feature.properties[propertyName]`.
 *
 * Returns `undefined` when neither a numeric `mapData` entry nor a usable
 * `propertyName` source is available.
 */
const findSizeDataEntry = (spec: VisualizationSpec): MapData | undefined => {
  return findSizeFromMapData(spec) ?? findSizeFromPropertyName(spec);
};

/**
 * Computes the default visual scale ceiling for proportional circles from the
 * size dataset's maximum value, rounded up to a nice cartographic number.
 *
 * Data is resolved from the first available source, in order:
 * 1. A `mapData` entry with `dimension: 'size'` (or the first entry).
 * 2. A layer's `propertyName` — values are extracted from the matching
 *    inline GeoJSON source's `feature.properties[propertyName]`.
 *
 * Returns `undefined` when no positive numeric maximum is available, leaving
 * `scaleMaxValue` unset so the adapter falls back to legend-driven sizing.
 */
const computeDefaultScaleMaxValue = (
  spec: VisualizationSpec
): number | undefined => {
  const sizeData = findSizeDataEntry(spec);
  const { isNumeric, numericValues } = inspectDataValues(sizeData?.data ?? []);
  if (!isNumeric || numericValues.length === 0) return undefined;
  const max = Math.max(...numericValues);
  const ceiling = niceCeil(max);
  return ceiling > 0 ? ceiling : undefined;
};

/**
 * Builds the auto-generated legend title that tells readers the circle size
 * encodes the value, naming the size dataset (or the first dataset) when a
 * title exists. Falls back to the layer's `propertyName` when no `mapData`
 * title is available.
 */
const buildSizeLegendTitle = (spec: VisualizationSpec): string => {
  const sizeLabel =
    findSizeDataEntry(spec)?.title ??
    spec.mapData?.[0]?.title ??
    spec.layers?.find((l) => {
      return l.propertyName;
    })?.propertyName;
  return sizeLabel ? `Circle size = ${sizeLabel}` : 'Circle size = value';
};

/**
 * Resolves a proportionalCircles mapType spec by auto-generating:
 * - A point layer with geometry: 'point' and pre-configured sizeBy
 * - A quantitative color legend whose title states the size dimension
 *   (e.g. `Circle size = total population`) based on data values (Jenks)
 */
const buildProportionalCircles = (
  spec: VisualizationSpec,
  sourceId: string
): {
  layers: VisualizationLayer[];
  legends: LegendSpec[];
} => {
  const mapDataEntry = spec.mapData?.[0];

  // --- Color legend (quantitative) ---
  const legendId = getProportionalCirclesAutoLegendId(spec);

  // This legend always gets its own colorBy with a default color, regardless
  // of whether another legend in the spec also declares one — each legend's
  // colorBy is independent, so an unrelated color legend must never strip
  // this one of its own coloring.
  const colorLegend: LegendSpec = {
    id: legendId,
    title: buildSizeLegendTitle(spec),
    colorBy: buildColorBy(mapDataEntry, spec),
  };

  // --- Point layer ---
  // The point layer's `mapDataId` is the SIZE reference. Derive it from the
  // resolved size entry rather than `mapData[0]`: when the only dataset is a
  // color dataset and size comes from a GeoJSON `propertyName`, the size entry
  // carries no `mapDataId`, so this stays `undefined` and the adapter's
  // `['get', propertyName]` size path remains enabled (it is gated on
  // `!layer.mapDataId`). Using `mapData[0]` here would wrongly attach the
  // color dataset's id and force the feature-state path, collapsing all
  // circles to a single radius.
  const sizeMapDataId = findSizeDataEntry(spec)?.mapDataId;

  const legendEnabled = spec.legendEnabled !== false;

  const pointLayer: VisualizationLayer = {
    id: `${sourceId}-proportional-circles`,
    sourceId,
    geometry: 'point',
    mapDataId: sizeMapDataId,
    activeLegendId: legendId,
    // When legendEnabled is false, the auto-generated legend is kept off
    // `spec.legends` (so it never surfaces in a rendered legend UI) but is
    // still attached here so `activeLegendId` keeps resolving colorBy/
    // threshold data for the adapter — disabling the legend must not also
    // silently disable color-by-value circle rendering.
    ...(legendEnabled ? {} : { legends: [colorLegend] }),
    sizeBy: {
      range: [
        PROPORTIONAL_CIRCLES_DEFAULTS.minRadiusPx,
        PROPORTIONAL_CIRCLES_DEFAULTS.maxRadiusPx,
      ],
      transform: 'sqrt',
    },
    // No `circleColor` here on purpose: a static color in the resolved paint
    // would win over the legend-driven color-by-value expression in the
    // adapter's `resolveCircleColor` (explicit paint always takes precedence,
    // and `injectResolvedFields` merges resolved paint into user paint, making
    // the two indistinguishable). The adapter itself falls back to a static
    // default when the legend resolves no expression, so the layer always
    // gets a paintable `circle-color`.
    paint: {
      circleColor:
        DEFAULT_DOT_DENSITY_PAINT.circleColor ??
        colorLegend.colorBy.defaultColor,
      circleOpacity: PROPORTIONAL_CIRCLES_DEFAULTS.circleOpacity,
      circleStrokeWidth: PROPORTIONAL_CIRCLES_DEFAULTS.strokeWidth,
      circleStrokeOpacity: PROPORTIONAL_CIRCLES_DEFAULTS.strokeOpacity,
    },
    hoverPaint: { lineColor: '#333333', lineWidth: 2 },
    selectedPaint: { lineColor: '#1a1a1a', lineWidth: 3 },
  };

  return {
    layers: [pointLayer],
    legends: legendEnabled ? [colorLegend] : [],
  };
};

/**
 * Finds the sourceId for proportional circles, supporting both:
 * - `mapData` path: delegates to `findMatchSourceId`
 * - Direct GeoJSON path: returns the first geojson source id
 */
const findProportionalCirclesSourceId = (spec: VisualizationSpec): string => {
  if (spec.mapData?.length) {
    return findMatchSourceId(spec);
  }
  return (
    spec.sources.find((s) => {
      return s.type === 'geojson';
    })?.id ?? 'unknown'
  );
};

/**
 * Entry point for proportionalCircles mapType resolution.
 * Called by `resolveSpecFromMapType` when `spec.mapType === 'proportionalCircles'`.
 *
 * Also resolves a default `scaleMaxValue` (nice-rounded data maximum) when the
 * user omits it, so the legend's reference circles use readable round numbers.
 * A user-provided `scaleMaxValue` is always preserved.
 *
 * Data for `scaleMaxValue` computation is resolved from the first available
 * source: `mapData` entries take precedence; when absent, the resolver reads
 * values from inline GeoJSON sources via `propertyName`.
 *
 * @param spec - The proportionalCircles visualization spec.
 * @returns Auto-generated `layers`, `legends`, and an optional resolved `scaleMaxValue`.
 */
export const resolveProportionalCircles = (
  spec: VisualizationSpec
): {
  layers: VisualizationLayer[];
  legends: LegendSpec[];
  scaleMaxValue?: number;
} => {
  const sourceId = findProportionalCirclesSourceId(spec);
  if (sourceId === 'unknown') {
    return { layers: [], legends: [] };
  }
  const { layers, legends } = buildProportionalCircles(spec, sourceId);
  const scaleMaxValue = spec.scaleMaxValue ?? computeDefaultScaleMaxValue(spec);
  return { layers, legends, scaleMaxValue };
};
