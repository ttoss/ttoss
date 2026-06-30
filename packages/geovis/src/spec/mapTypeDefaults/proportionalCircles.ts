import type {
  LegendSpec,
  VisualizationLayer,
  VisualizationSpec,
} from '../types';
import { DEFAULT_SEQUENTIAL_PALETTE } from './palettes';
import {
  computeJenksBreaks,
  computeNumClasses,
  findMatchSourceId,
  inspectDataValues,
  niceCeil,
  pickPaletteColors,
} from './utils';

export const PROPORTIONAL_CIRCLES_DEFAULTS = {
  minRadiusPx: 4,
  maxRadiusPx: 16,
  zeroRadiusPx: 0,
  circleOpacity: 0.72,
  strokeWidth: 1,
  strokeOpacity: 0.9,
} as const;

/**
 * Builds a quantitative color-by using Jenks natural breaks from the
 * first mapData entry's numeric values. Falls back to a single-bin
 * palette when data is insufficient for meaningful breaks.
 */
const buildColorBy = (
  mapDataEntry: VisualizationSpec['mapData'] extends (infer U)[]
    ? U
    : never | undefined
) => {
  const { isNumeric, numericValues } = inspectDataValues(
    mapDataEntry?.data ?? []
  );

  if (isNumeric && numericValues.length > 1) {
    const uniqueCount = new Set(numericValues).size;
    const numClasses = computeNumClasses(uniqueCount);
    const breaks = computeJenksBreaks(numericValues, numClasses);
    return {
      type: 'quantitative' as const,
      property: 'value',
      scale: 'threshold' as const,
      thresholds: breaks,
      colors: pickPaletteColors(DEFAULT_SEQUENTIAL_PALETTE, breaks.length + 1),
      defaultColor: '#f0f0f0',
    };
  }

  return {
    type: 'quantitative' as const,
    property: 'value',
    scale: 'threshold' as const,
    thresholds: [],
    colors: [DEFAULT_SEQUENTIAL_PALETTE[0] ?? '#dbeafe'],
    defaultColor: '#f0f0f0',
  };
};

/**
 * Finds the first suitable size entry from `spec.mapData`.
 *
 * Prefers an entry with `dimension: 'size'`; falls back to the first entry
 * only when it contains numeric data (non-numeric entries like categorical
 * color data are skipped).
 */
const findSizeFromMapData = (
  spec: VisualizationSpec
): VisualizationSpec['mapData'] extends (infer U)[] ? U : never | undefined => {
  const data = spec.mapData;
  if (!data?.length) return undefined as never;

  const explicitSize = data.find((m) => {
    return m.dimension === 'size';
  });
  if (explicitSize) return explicitSize as never;

  // Fallback to first entry only when it contains numeric data.
  const first = data[0];
  const { isNumeric } = inspectDataValues(first?.data ?? []);
  return (isNumeric ? first : undefined) as never;
};

/**
 * Extracts size values from a layer's `propertyName` via inline GeoJSON.
 * Returns a synthetic `MapDataRow[]` entry, or `undefined` when no
 * `propertyName` layer with inline data is available.
 */
const findSizeFromPropertyName = (
  spec: VisualizationSpec
): VisualizationSpec['mapData'] extends (infer U)[] ? U : never | undefined => {
  const propLayer = spec.layers?.find((l) => {
    return l.propertyName;
  });
  if (!propLayer) return undefined as never;

  const source = spec.sources.find((s) => {
    return s.id === propLayer.sourceId && s.type === 'geojson';
  }) as
    | {
        type: 'geojson';
        data: { features?: Array<{ properties?: Record<string, unknown> }> };
      }
    | undefined;
  if (!source?.data?.features) return undefined as never;

  const values: MapDataRow[] = source.data.features.map((f) => {
    return {
      geometryId: '',
      value: (f.properties?.[propLayer.propertyName!] as number) ?? 0,
    };
  });

  return { data: values } as never;
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
const findSizeDataEntry = (
  spec: VisualizationSpec
): VisualizationSpec['mapData'] extends (infer U)[]
  ? U | undefined
  : undefined => {
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
  const sizeLabel = findSizeDataEntry(spec)?.title ?? spec.mapData?.[0]?.title;
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
  const mapDataId = mapDataEntry?.mapDataId ?? 'unknown';

  // --- Color legend (quantitative) ---
  const legendId = `${mapDataId}-legend`;
  const skipColorBy = spec.legends?.some((l) => {
    return l.colorBy && l.id !== legendId;
  });

  const colorLegend: LegendSpec = {
    id: legendId,
    title: buildSizeLegendTitle(spec),
    // When the user already supplies a colour legend, omit `colorBy` so this
    // legend renders only the size reference circles (the runtime gates the
    // circles to the legend that has no `colorBy`). The size title keeps full
    // visual weight in both paths.
    ...(skipColorBy ? {} : { colorBy: buildColorBy(mapDataEntry) }),
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

  const pointLayer: VisualizationLayer = {
    id: `${sourceId}-proportional-circles`,
    sourceId,
    geometry: 'point',
    mapDataId: sizeMapDataId,
    activeLegendId: legendId,
    sizeBy: {
      range: [
        PROPORTIONAL_CIRCLES_DEFAULTS.minRadiusPx,
        PROPORTIONAL_CIRCLES_DEFAULTS.maxRadiusPx,
      ],
      transform: 'sqrt',
    },
    paint: {
      circleOpacity: PROPORTIONAL_CIRCLES_DEFAULTS.circleOpacity,
      circleStrokeWidth: PROPORTIONAL_CIRCLES_DEFAULTS.strokeWidth,
      circleStrokeOpacity: PROPORTIONAL_CIRCLES_DEFAULTS.strokeOpacity,
    },
    hoverPaint: { lineColor: '#333333', lineWidth: 2 },
    selectedPaint: { lineColor: '#1a1a1a', lineWidth: 3 },
  };

  return {
    layers: [pointLayer],
    legends: [colorLegend],
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
