import type maplibregl from 'maplibre-gl';

import { PROPORTIONAL_CIRCLES_DEFAULTS } from '../../spec/mapTypeDefaults/proportionalCircles';
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
import { buildExtrusionHeightExpression } from './extrusion';
import {
  resolveDimensionMapData,
  resolveDimensionStateKey,
  resolveThresholdBreaks,
} from './layerBindings';
import { layerFilterToExpression } from './layerFilter';
import {
  buildFillColorExpression,
  buildProportionalCircleRadiusExpression,
  buildSizeExpression,
} from './legendTranslation';

interface BuilderContext {
  legends?: LegendSpec[];
  mapData?: MapData[];
  scaleMaxValue?: number;
}

interface BaseFields {
  id: string;
  source: string;
  minzoom?: number;
  maxzoom?: number;
  layout: { visibility: 'visible' | 'none' };
  ['source-layer']?: string;
  filter?: unknown[];
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
  if (layer.filter) base.filter = layerFilterToExpression(layer.filter);
  return base;
};

type Builder = (
  base: BaseFields,
  layer: VisualizationLayer,
  paint: VisualizationLayer['paint'],
  ctx?: BuilderContext
) => maplibregl.LayerSpecification;

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

/**
 * Whether a layer renders as a MapLibre `fill-extrusion` rather than a flat
 * `fill`: a polygon layer that declares `extrusion`.
 */
export const isExtrudedLayer = (layer: VisualizationLayer): boolean => {
  return layer.geometry === 'polygon' && layer.extrusion !== undefined;
};

/**
 * The paint property carrying a polygon layer's fill colour — `fill-color`
 * flat, `fill-extrusion-color` extruded.
 */
export const polygonFillColorProperty = (layer: VisualizationLayer): string => {
  return isExtrudedLayer(layer) ? 'fill-extrusion-color' : 'fill-color';
};

/** Breaks as a `step` needs them: finite, unique and ascending. */
const normalizeBreaks = (breaks: ReadonlyArray<number>): number[] => {
  return [...new Set(breaks.filter(Number.isFinite))].sort((a, b) => {
    return a - b;
  });
};

/**
 * Resolves the `fill-extrusion-height` expression of an extruded polygon
 * layer: from the dataset `extrusion.mapDataId` names, or the one its colour
 * reads, stepped over `extrusion.thresholds` or — reading the colour's
 * dataset — the active legend's breaks.
 *
 * @remarks
 * Exported for the same reason as {@link resolveLegendFillColorExpression}:
 * a `mapData` mutation can move the continuous scale's top, so runtime update
 * flows re-apply the height alongside the colour.
 *
 * @param layer - The visualization layer.
 * @param specLegends - Optional legend registry.
 * @param specMapData - Optional mapData array for stateKey resolution.
 * @returns The expression, or undefined when the layer is not extruded.
 */
export const resolveExtrusionHeightExpression = (
  layer: VisualizationLayer,
  specLegends?: LegendSpec[],
  specMapData?: MapData[]
): unknown[] | number | undefined => {
  if (!isExtrudedLayer(layer)) return undefined;
  const extrusion = layer.extrusion!;
  const colorMapData = resolveDimensionMapData(
    'color',
    layer.sourceId,
    layer.mapDataId,
    specMapData
  );
  // A dataset of its own when the extrusion names one that exists; an unknown
  // id (a validation error) falls back to the colour's rather than going flat.
  const ownMapData = extrusion.mapDataId
    ? specMapData?.find((entry) => {
        return entry.mapDataId === extrusion.mapDataId;
      })
    : undefined;
  const heightMapData = ownMapData ?? colorMapData;
  // The colour legend's breaks describe the colour's indicator, so they only
  // carry over when the height reads that same dataset.
  const breaks =
    extrusion.thresholds ??
    (ownMapData ? [] : resolveThresholdBreaks(layer, specLegends));
  return buildExtrusionHeightExpression({
    extrusion,
    breaks: normalizeBreaks(breaks),
    stateKey: heightMapData?.stateKey ?? 'value',
    mapData: heightMapData,
  });
};

/**
 * Builds a MapLibre `fill-extrusion` layer spec from an extruded polygon
 * layer: the flat layer's colour and opacity, plus a height read from the same
 * value (see `buildExtrusionHeightExpression`). `lineColor` has no
 * counterpart — a prism has no outline.
 */
const buildExtrudedPolygon: Builder = (base, layer, paint, ctx) => {
  const fp = (paint ?? {}) as FillPaint;
  const legendFillColor = resolveLegendFillColorExpression(
    layer,
    ctx?.legends,
    ctx?.mapData
  );
  return {
    ...base,
    type: 'fill-extrusion',
    paint: {
      'fill-extrusion-color': legendFillColor ?? fp.fillColor ?? '#3b82f6',
      'fill-extrusion-opacity': fp.fillOpacity ?? 1,
      'fill-extrusion-height': resolveExtrusionHeightExpression(
        layer,
        ctx?.legends,
        ctx?.mapData
      ),
      'fill-extrusion-base': 0,
    },
  } as maplibregl.LayerSpecification;
};

/** Builds a MapLibre `fill` layer spec from a GeoVis polygon layer. */
const buildPolygon: Builder = (base, layer, paint, ctx) => {
  if (isExtrudedLayer(layer)) {
    return buildExtrudedPolygon(base, layer, paint, ctx);
  }
  const fp = (paint ?? {}) as FillPaint;
  const legendFillColor = resolveLegendFillColorExpression(
    layer,
    ctx?.legends,
    ctx?.mapData
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
const buildLine: Builder = (base, _layer, paint, _ctx) => {
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
  // An explicit user-provided circleColor always wins over the legend-driven
  // color-by-value expression — otherwise a custom paint override would be
  // silently discarded whenever the layer carries an activeLegendId (which
  // auto-generated mapTypes like proportionalCircles always set).
  if (cp.circleColor) return cp.circleColor;
  if (!layer.activeLegendId) return '#3b82f6';

  const activeLegend =
    layer.legends?.find((l) => {
      return l.id === layer.activeLegendId;
    }) ??
    specLegends?.find((l) => {
      return l.id === layer.activeLegendId;
    });
  if (!activeLegend) return '#3b82f6';

  // A colorless legend (no `colorBy`) resolves no expression; fall back to a
  // static default so MapLibre still receives a valid `circle-color` and the
  // layer is never silently dropped.
  return (
    buildFillColorExpression({
      legend: activeLegend,
      breaks: resolveThresholdBreaks(layer, specLegends),
      stateKey: colorStateKey,
    }) ?? '#3b82f6'
  );
};

const buildCircleRadius = (
  layer: VisualizationLayer,
  sizeStateKey: string,
  fallbackRadius: number,
  ctx?: BuilderContext
): number | unknown => {
  if (!layer.sizeBy) return fallbackRadius;
  const smv = ctx?.scaleMaxValue;
  if (smv != null) {
    const useGetExpression = !!layer.propertyName && !layer.mapDataId;
    const stateKey = useGetExpression ? layer.propertyName! : sizeStateKey;
    return buildProportionalCircleRadiusExpression({
      sizeBy: layer.sizeBy,
      scaleMaxValue: smv,
      zeroRadiusPx: PROPORTIONAL_CIRCLES_DEFAULTS.zeroRadiusPx,
      stateKey,
      useGetExpression,
    });
  }
  const legendThresholds = resolveThresholdBreaks(layer, ctx?.legends);
  const useGet = !!layer.propertyName && !layer.mapDataId;
  return buildSizeExpression(
    layer.sizeBy,
    fallbackRadius,
    legendThresholds,
    useGet ? layer.propertyName! : sizeStateKey,
    useGet
  );
};

/** Builds a MapLibre `circle` layer spec from a GeoVis point layer. */
const buildPoint: Builder = (base, layer, paint, ctx) => {
  const cp = (paint ?? {}) as CirclePaint;
  const fallbackRadius = cp.circleRadius ?? 6;

  const colorStateKey = resolveDimensionStateKey(
    'color',
    layer.sourceId,
    layer.mapDataId,
    ctx?.mapData
  );

  const sizeStateKey = resolveDimensionStateKey(
    'size',
    layer.sourceId,
    layer.mapDataId,
    ctx?.mapData
  );

  const circleColor = resolveCircleColor(
    layer,
    cp,
    colorStateKey,
    ctx?.legends
  );

  return {
    ...base,
    type: 'circle',
    paint: {
      'circle-color': circleColor,
      'circle-radius': buildCircleRadius(
        layer,
        sizeStateKey,
        fallbackRadius,
        ctx
      ),
      'circle-opacity': cp.circleOpacity ?? 1,
      'circle-stroke-color': cp.circleStrokeColor ?? '#ffffff',
      'circle-stroke-opacity': cp.circleStrokeOpacity ?? 1,
      'circle-stroke-width': cp.circleStrokeWidth ?? 1,
    },
  } as maplibregl.LayerSpecification;
};

/** Builds a MapLibre `heatmap` layer spec from a GeoVis heatmap layer. */
const buildHeatmap: Builder = (base, _layer, paint, _ctx) => {
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

/**
 * MapLibre `layout` keys of the symbol icon, by `SymbolPaint` field. Each is
 * written only when the layer sets it, for the same reason as `icon-image`
 * in `buildSymbolLayout` below: an `undefined` layout value makes MapLibre
 * reject the whole layer.
 */
const ICON_LAYOUT_KEYS = {
  iconImage: 'icon-image',
  iconSize: 'icon-size',
  iconAnchor: 'icon-anchor',
  iconOffset: 'icon-offset',
  iconAllowOverlap: 'icon-allow-overlap',
} as const satisfies Partial<Record<keyof SymbolPaint, string>>;

/** The icon's `layout` entries the layer declares, and none it does not. */
const buildIconLayout = (sp: SymbolPaint): Record<string, unknown> => {
  return Object.fromEntries(
    Object.entries(ICON_LAYOUT_KEYS)
      .filter(([field]) => {
        return sp[field as keyof typeof ICON_LAYOUT_KEYS] !== undefined;
      })
      .map(([field, key]) => {
        return [key, sp[field as keyof typeof ICON_LAYOUT_KEYS]];
      })
  );
};

/**
 * Builds the `symbol` layer's `layout` block — the label text, size, fontstack
 * and icon. GeoVis carries these in the `paint` bag, which MapLibre splits
 * between `paint` and `layout`.
 *
 * `icon-image` is omitted rather than written as `undefined` when the layer
 * declares no icon. MapLibre validates `layout` on `addLayer` and rejects the
 * whole layer with `'undefined' value invalid, use null instead`, which aborts
 * the surrounding layer sync — `stripUndefinedPaint` cleans `paint` only, so a
 * text-only symbol layer would never reach the map.
 *
 * `text-font` is always written, defaulting to `Noto Sans Regular`. MapLibre's
 * own default fontstack (`Open Sans Regular`, `Arial Unicode MS Regular`) is
 * served by neither OpenFreeMap nor most OpenMapTiles-derived basemaps, so
 * leaving it unset 404s the glyph request and draws no text — a silent failure
 * that looks like the layer never mounted.
 *
 * Split out of `buildSymbol` so each stays under the complexity budget the
 * ESLint config enforces; `paint` and `layout` have no shared defaults.
 */
const buildSymbolLayout = (sp: SymbolPaint): Record<string, unknown> => {
  return {
    'text-field': sp.textField ?? '',
    'text-size': sp.textSize ?? 12,
    'text-font': sp.textFont ?? ['Noto Sans Regular'],
    ...buildIconLayout(sp),
  };
};

/** Builds a MapLibre `symbol` layer spec from a GeoVis symbol layer. */
const buildSymbol: Builder = (base, _layer, paint, _ctx) => {
  const sp = (paint ?? {}) as SymbolPaint;
  return {
    ...base,
    type: 'symbol',
    layout: { ...base.layout, ...buildSymbolLayout(sp) },
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
const buildRaster: Builder = (base, _layer, paint, _ctx) => {
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
 * @param scaleMaxValue - Optional visual scale ceiling for proportional circles.
 * @returns A MapLibre LayerSpecification ready for `map.addLayer`.
 */
export const toMaplibreLayer = (
  layer: VisualizationLayer,
  sourceLayer?: string,
  specLegends?: LegendSpec[],
  specMapData?: MapData[],
  scaleMaxValue?: number
): maplibregl.LayerSpecification => {
  const base = buildBase(layer, sourceLayer);
  const ctx: BuilderContext = {
    legends: specLegends,
    mapData: specMapData,
    scaleMaxValue,
  };
  return builders[layer.geometry](base, layer, layer.paint, ctx);
};
