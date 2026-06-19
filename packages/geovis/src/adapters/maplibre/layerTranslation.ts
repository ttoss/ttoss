import type maplibregl from 'maplibre-gl';

import type {
  CirclePaint,
  FillPaint,
  GeoVisGeometryType,
  HeatmapPaint,
  LinePaint,
  MapData,
  RasterPaint,
  SymbolPaint,
  VisualizationLayer,
} from '../../spec/types';
import type { LegendSpec } from '../../spec/types.legend';
import {
  buildFillColorExpression,
  buildSizeExpression,
} from './legendTranslation';

interface BaseFields {
  id: string;
  source: string;
  minzoom?: number;
  maxzoom?: number;
  layout: { visibility: 'visible' | 'none' };
  ['source-layer']?: string;
}

/** Builds the common MapLibre layer fields from a GeoVis layer. */
const buildBase = (
  layer: VisualizationLayer,
  sourceLayer: string | undefined
): BaseFields => {
  const base: BaseFields = {
    id: layer.id,
    source: layer.sourceId,
    minzoom: layer.minzoom,
    maxzoom: layer.maxzoom,
    layout: {
      visibility: layer.visible === false ? 'none' : 'visible',
    },
  };
  const effective = layer.sourceLayer ?? sourceLayer;
  if (effective) base['source-layer'] = effective;
  return base;
};

type Builder = (
  base: BaseFields,
  layer: VisualizationLayer,
  paint: VisualizationLayer['paint'],
  specLegends?: LegendSpec[],
  specMapData?: MapData[]
) => maplibregl.LayerSpecification;

/** Resolves the stateKey for a given dimension from the spec's mapData array. */
const resolveDimensionStateKey = (
  dimension: 'color' | 'size',
  sourceId: string,
  layerMapDataId: string | undefined,
  specMapData?: MapData[]
): string => {
  // Prefer dataset explicitly marked with this dimension, scoped to the layer's source
  const byDimension = specMapData?.find((m) => {
    return m.dimension === dimension && m.mapId === sourceId;
  });
  if (byDimension) return byDimension.stateKey ?? 'value';

  // Fallback: legacy layer.mapDataId (single-dimension, no dimension declared)
  if (layerMapDataId) {
    const byId = specMapData?.find((m) => {
      return m.mapDataId === layerMapDataId;
    });
    if (byId) return byId.stateKey ?? 'value';
  }

  return 'value';
};

const resolveThresholdBreaks = (
  layer: VisualizationLayer,
  specLegends?: LegendSpec[]
): number[] => {
  const legend =
    layer.legends?.find((item) => {
      return item.id === layer.activeLegendId;
    }) ??
    specLegends?.find((item) => {
      return item.id === layer.activeLegendId;
    });
  if (!legend || legend.colorBy.type !== 'quantitative') return [];
  if (legend.colorBy.scale !== 'threshold') return [];
  return Array.from(
    new Set(
      (legend.colorBy.thresholds ?? []).filter((value) => {
        return Number.isFinite(value);
      })
    )
  ).sort((a, b) => {
    return a - b;
  });
};

/**
 * Resolves a legend-driven fill expression for polygon layers.
 *
 * @remarks
 * Exported so runtime update flows can re-apply the same expression after
 * mapData mutations, keeping style and feature-state paths in sync.
 *
 * @param layer - The visualization layer.
 * @param specLegends - Optional legend registry.
 * @param specMapData - Optional mapData array for stateKey resolution.
 * @returns A MapLibre expression array, or undefined when not applicable.
 */
export const resolveLegendFillColorExpression = (
  layer: VisualizationLayer,
  specLegends?: LegendSpec[],
  specMapData?: MapData[]
): unknown[] | undefined => {
  if (layer.geometry !== 'polygon') return undefined;
  if (!layer.activeLegendId) return undefined;

  const activeLegend =
    layer.legends?.find((legend) => {
      return legend.id === layer.activeLegendId;
    }) ??
    specLegends?.find((legend) => {
      return legend.id === layer.activeLegendId;
    });
  if (!activeLegend) return undefined;

  // Resolve stateKey for color dimension
  const colorStateKey = resolveDimensionStateKey(
    'color',
    layer.sourceId,
    layer.mapDataId,
    specMapData
  );

  return buildFillColorExpression({
    legend: activeLegend,
    breaks: resolveThresholdBreaks(layer, specLegends),
    stateKey: colorStateKey,
  });
};

/** Builds a MapLibre `fill` layer spec from a GeoVis polygon layer. */
const buildPolygon: Builder = (
  base,
  layer,
  paint,
  specLegends,
  specMapData
) => {
  const fp = (paint ?? {}) as FillPaint;
  const legendFillColor = resolveLegendFillColorExpression(
    layer,
    specLegends,
    specMapData
  );
  return {
    ...base,
    type: 'fill',
    paint: {
      'fill-color': legendFillColor ?? fp.fillColor ?? '#3b82f6',
      'fill-opacity': fp.fillOpacity ?? 1,
      'fill-outline-color': fp.lineColor ?? '#1d4ed8',
    },
  } as maplibregl.LayerSpecification;
};

/** Builds a MapLibre `line` layer spec from a GeoVis line layer. */
const buildLine: Builder = (base, _layer, paint) => {
  const lp = (paint ?? {}) as LinePaint;
  return {
    ...base,
    type: 'line',
    paint: {
      'line-color': lp.lineColor ?? '#3b82f6',
      'line-width': lp.lineWidth ?? 2,
      'line-opacity': lp.lineOpacity ?? 1,
      'line-dasharray': lp.lineDasharray,
    },
  } as maplibregl.LayerSpecification;
};

/** Resolves circle-color from legend or static paint. */
const resolveCircleColor = (
  layer: VisualizationLayer,
  cp: CirclePaint,
  colorStateKey: string,
  specLegends?: LegendSpec[]
): string | unknown => {
  if (!layer.activeLegendId) return cp.circleColor ?? '#3b82f6';

  const activeLegend =
    layer.legends?.find((l) => {
      return l.id === layer.activeLegendId;
    }) ??
    specLegends?.find((l) => {
      return l.id === layer.activeLegendId;
    });
  if (!activeLegend) return cp.circleColor ?? '#3b82f6';

  return buildFillColorExpression({
    legend: activeLegend,
    breaks: resolveThresholdBreaks(layer, specLegends),
    stateKey: colorStateKey,
  });
};

/** Builds a MapLibre `circle` layer spec from a GeoVis point layer. */
const buildPoint: Builder = (base, layer, paint, specLegends, specMapData) => {
  const cp = (paint ?? {}) as CirclePaint;
  const fallbackRadius = cp.circleRadius ?? 6;

  const colorStateKey = resolveDimensionStateKey(
    'color',
    layer.sourceId,
    layer.mapDataId,
    specMapData
  );

  const sizeStateKey = resolveDimensionStateKey(
    'size',
    layer.sourceId,
    layer.mapDataId,
    specMapData
  );

  const circleColor = resolveCircleColor(layer, cp, colorStateKey, specLegends);

  let radius: number | unknown = fallbackRadius;
  if (layer.sizeBy) {
    const legendThresholds = resolveThresholdBreaks(layer, specLegends);
    radius = buildSizeExpression(
      layer.sizeBy,
      fallbackRadius,
      legendThresholds,
      sizeStateKey
    );
  }

  return {
    ...base,
    type: 'circle',
    paint: {
      'circle-color': circleColor,
      'circle-radius': radius,
      'circle-opacity': cp.circleOpacity ?? 1,
      'circle-stroke-color': cp.circleStrokeColor ?? '#ffffff',
      'circle-stroke-width': cp.circleStrokeWidth ?? 1,
    },
  } as maplibregl.LayerSpecification;
};

/** Builds a MapLibre `heatmap` layer spec from a GeoVis heatmap layer. */
const buildHeatmap: Builder = (base, _layer, paint) => {
  const hp = (paint ?? {}) as HeatmapPaint;
  return {
    ...base,
    type: 'heatmap',
    paint: {
      'heatmap-radius': hp.heatmapRadius ?? 15,
      'heatmap-opacity': hp.heatmapOpacity ?? 1,
      'heatmap-intensity': hp.heatmapIntensity ?? 1,
      'heatmap-weight': hp.heatmapWeight ?? 1,
    },
  } as maplibregl.LayerSpecification;
};

/** Builds a MapLibre `symbol` layer spec from a GeoVis symbol layer. */
const buildSymbol: Builder = (base, _layer, paint) => {
  const sp = (paint ?? {}) as SymbolPaint;
  return {
    ...base,
    type: 'symbol',
    layout: {
      ...base.layout,
      'text-field': sp.textField ?? '',
      'text-size': sp.textSize ?? 12,
      'icon-image': sp.iconImage,
    },
    paint: {
      'text-color': sp.textColor ?? '#000000',
      'text-opacity': sp.textOpacity ?? 1,
      'text-halo-color': sp.textHaloColor ?? '#ffffff',
      'text-halo-width': sp.textHaloWidth ?? 0,
      'icon-color': sp.iconColor ?? '#000000',
      'icon-opacity': sp.iconOpacity ?? 1,
    },
  } as maplibregl.LayerSpecification;
};

/** Builds a MapLibre `raster` layer spec from a GeoVis raster layer. */
const buildRaster: Builder = (base, _layer, paint) => {
  const rp = (paint ?? {}) as RasterPaint;
  return {
    ...base,
    type: 'raster',
    paint: {
      'raster-opacity': rp.rasterOpacity ?? 1,
    },
  } as maplibregl.LayerSpecification;
};

const builders: Record<GeoVisGeometryType, Builder> = {
  polygon: buildPolygon,
  line: buildLine,
  point: buildPoint,
  heatmap: buildHeatmap,
  symbol: buildSymbol,
  raster: buildRaster,
};

/**
 * Strips `undefined` paint values before `map.addLayer` to satisfy MapLibre's strict paint validation.
 * Shared by `syncSourcesAndLayers` and `MapLibreAdapter` to avoid drift between the two call sites.
 */
export const stripUndefinedPaint = (
  layer: maplibregl.LayerSpecification
): maplibregl.LayerSpecification => {
  const paint = (layer as { paint?: Record<string, unknown> }).paint;
  if (paint) {
    (layer as { paint?: Record<string, unknown> }).paint = Object.fromEntries(
      Object.entries(paint).filter(([, v]) => {
        return v !== undefined;
      })
    );
  }
  return layer;
};

/**
 * Translates a `VisualizationLayer` into a MapLibre `LayerSpecification`.
 * Sole translation boundary between the GeoVis layer model and MapLibre.
 * Geometry type dispatches to a dedicated builder via the `builders` map.
 *
 * @param layer - The visualization layer to translate.
 * @param sourceLayer - Optional vector tile source layer name.
 * @param specLegends - Optional legend registry for choropleth coloring.
 * @param specMapData - Optional mapData array for stateKey resolution.
 * @returns A MapLibre LayerSpecification ready for `map.addLayer`.
 */
export const toMaplibreLayer = (
  layer: VisualizationLayer,
  sourceLayer?: string,
  specLegends?: LegendSpec[],
  specMapData?: MapData[]
): maplibregl.LayerSpecification => {
  const base = buildBase(layer, sourceLayer);
  return builders[layer.geometry](
    base,
    layer,
    layer.paint,
    specLegends,
    specMapData
  );
};
