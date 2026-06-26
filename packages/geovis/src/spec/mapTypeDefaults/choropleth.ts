import type {
  CategoricalColorBy,
  LegendSpec,
  QuantitativeColorBy,
  VisualizationLayer,
  VisualizationSpec,
} from '../types';
import { CATEGORICAL_PALETTE, DEFAULT_SEQUENTIAL_PALETTE } from './palettes';
import {
  computeJenksBreaks,
  computeNumClasses,
  findMatchSourceId,
  inspectDataValues,
  pickPaletteColors,
} from './utils';

/**
 * Resolves a choropleth mapType spec by auto-generating:
 * - A polygon layer with geometry: 'polygon'
 * - A quantitative or categorical legend based on data type
 * - A line outline layer
 *
 * Uses raw data values for Jenks thresholds (Path A).
 */
export const resolveChoropleth = (
  spec: VisualizationSpec
): {
  layers: VisualizationLayer[];
  legends: LegendSpec[];
} => {
  const sourceId = findMatchSourceId(spec);
  const mapDataEntry = spec.mapData?.[0];
  const mapDataId = mapDataEntry?.mapDataId ?? 'unknown';

  const { isNumeric, numericValues, categoricalValues } = inspectDataValues(
    mapDataEntry?.data ?? []
  );
  let colorBy: QuantitativeColorBy | CategoricalColorBy;
  const legendId = `${mapDataId}-legend`;

  if (isNumeric) {
    const uniqueCount = new Set(numericValues).size;
    const numClasses = computeNumClasses(uniqueCount);
    const breaks = computeJenksBreaks(numericValues, numClasses);

    colorBy = {
      type: 'quantitative',
      property: 'value',
      scale: 'threshold',
      thresholds: breaks,
      colors: pickPaletteColors(DEFAULT_SEQUENTIAL_PALETTE, breaks.length + 1),
      defaultColor: '#f0f0f0',
    };
  } else {
    const mapping: Record<string, string> = {};
    for (const [i, val] of categoricalValues.entries()) {
      mapping[val] = CATEGORICAL_PALETTE[i % CATEGORICAL_PALETTE.length];
    }

    colorBy = {
      type: 'categorical',
      property: 'value',
      mapping,
      defaultColor: '#d3d3d3',
    };
  }

  const legend: LegendSpec = {
    id: legendId,
    title: mapDataEntry?.title ?? 'value',
    colorBy,
  };

  const fillLayer: VisualizationLayer = {
    id: `${sourceId}-fill`,
    sourceId,
    geometry: 'polygon',
    mapDataId,
    activeLegendId: legendId,
    hoverPaint: { lineColor: '#333333', lineWidth: 2 },
    selectedPaint: { lineColor: '#1a1a1a', lineWidth: 3 },
  };

  const outlineLayer: VisualizationLayer = {
    id: `${sourceId}-outline`,
    sourceId,
    geometry: 'line',
    paint: { lineColor: '#94a3b8', lineWidth: 0.5 },
  };

  return {
    layers: [fillLayer, outlineLayer],
    legends: [legend],
  };
};
