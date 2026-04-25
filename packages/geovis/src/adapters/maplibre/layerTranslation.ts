import type maplibregl from 'maplibre-gl';

import type {
  CirclePaint,
  FillPaint,
  GeoVisGeometryType,
  HeatmapPaint,
  LinePaint,
  RasterPaint,
  SymbolPaint,
  VisualizationLayer,
} from '../../spec/types';

interface BaseFields {
  id: string;
  source: string;
  minzoom?: number;
  maxzoom?: number;
  layout: { visibility: 'visible' | 'none' };
  ['source-layer']?: string;
}

/**
 * Builds the fields common to all MapLibre layer types from a GeoVis
 * `VisualizationLayer`.
 *
 * @remarks
 * `sourceLayer` is applied only when present — it is required for
 * vector-tile sources (which carry multiple layers per tile), but must be
 * absent for GeoJSON sources (MapLibre ignores unknown fields for GeoJSON,
 * but keeping the contract explicit prevents confusion).
 *
 * `visible === false` maps to `layout.visibility: 'none'`; any other value
 * (including `undefined`) defaults to `'visible'`.
 */
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
  paint: VisualizationLayer['paint']
) => maplibregl.LayerSpecification;

/** Builds a MapLibre `fill` layer spec from a GeoVis polygon layer. */
const buildPolygon: Builder = (base, paint) => {
  const fp = (paint ?? {}) as FillPaint;
  return {
    ...base,
    type: 'fill',
    paint: {
      'fill-color': fp.fillColor ?? '#3b82f6',
      'fill-opacity': fp.fillOpacity ?? 0.6,
      'fill-outline-color': fp.lineColor ?? '#1d4ed8',
    },
  } as maplibregl.LayerSpecification;
};

/** Builds a MapLibre `line` layer spec from a GeoVis line layer. */
const buildLine: Builder = (base, paint) => {
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

/** Builds a MapLibre `circle` layer spec from a GeoVis point layer. */
const buildPoint: Builder = (base, paint) => {
  const cp = (paint ?? {}) as CirclePaint;
  return {
    ...base,
    type: 'circle',
    paint: {
      'circle-color': cp.circleColor ?? '#3b82f6',
      'circle-radius': cp.circleRadius ?? 6,
      'circle-opacity': cp.circleOpacity ?? 1,
      'circle-stroke-color': cp.circleStrokeColor ?? '#ffffff',
      'circle-stroke-width': cp.circleStrokeWidth ?? 1,
    },
  } as maplibregl.LayerSpecification;
};

/** Builds a MapLibre `heatmap` layer spec from a GeoVis heatmap layer. */
const buildHeatmap: Builder = (base, paint) => {
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
const buildSymbol: Builder = (base, paint) => {
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
const buildRaster: Builder = (base, paint) => {
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
 * Translates a `VisualizationLayer` from the GeoVis spec model into a
 * MapLibre `LayerSpecification`.
 *
 * @remarks
 * This function is the sole translation boundary between the GeoVis layer
 * model and the MapLibre API. Concentrating all field mappings here prevents
 * engine-specific semantics (geometry-type–dependent property names, default
 * values) from leaking into the runtime or higher layers.
 *
 * Geometry type dispatches to a dedicated builder via the `builders` map.
 * Adding a new geometry type only requires a new builder entry — no branching
 * logic is needed in this function.
 *
 * @param layer - A layer entry from `VisualizationSpec.layers`.
 * @param sourceLayer - Optional source-layer name for vector-tile sources.
 *   When provided it overrides `layer.sourceLayer`.
 * @returns A MapLibre-ready `LayerSpecification` for use with `map.addLayer()`.
 */
export const toMaplibreLayer = (
  layer: VisualizationLayer,
  sourceLayer?: string
): maplibregl.LayerSpecification => {
  const base = buildBase(layer, sourceLayer);
  return builders[layer.geometry](base, layer.paint);
};
