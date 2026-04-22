import { computeBoundsFromSources } from './computeBoundsFromSources';
import type {
  GeoJSONFeatureCollection,
  GeoJSONObject,
  GeoVisDataEntry,
  GeoVisGeometryType,
  VisualizationLayer,
  VisualizationSpec,
} from './types';

/**
 * Partial form of `VisualizationSpec` accepted as input by the runtime.
 * Every field is optional; `applyDefaults` fills in id, engine, view, and
 * layers when omitted. `data` defaults to an empty array.
 */
export type PartialVisualizationSpec = Partial<VisualizationSpec>;

const collectInlineGeometryTypes = (
  obj: GeoJSONObject
): Set<GeoVisGeometryType> => {
  const types = new Set<GeoVisGeometryType>();
  const add = (geomType: string) => {
    switch (geomType) {
      case 'Point':
      case 'MultiPoint':
        types.add('point');
        return;
      case 'LineString':
      case 'MultiLineString':
        types.add('line');
        return;
      case 'Polygon':
      case 'MultiPolygon':
        types.add('polygon');
        return;
      default:
        return;
    }
  };

  if (obj.type === 'FeatureCollection') {
    for (const f of (obj as GeoJSONFeatureCollection).features) {
      if (f.geometry) add(f.geometry.type);
    }
  } else if (obj.type === 'Feature') {
    if (obj.geometry) add(obj.geometry.type);
  } else {
    add(obj.type);
  }

  return types;
};

const geometryTypesForEntry = (
  entry: GeoVisDataEntry
): Set<GeoVisGeometryType> => {
  if (entry.kind === 'geojson-inline') {
    return collectInlineGeometryTypes(entry.geojson);
  }
  if (entry.kind === 'raster-tiles' || entry.kind === 'image') {
    return new Set(['raster']);
  }
  // `geojson-url`, vector tiles, raster-dem, video and native cannot be
  // inferred statically — assume polygon as a sensible visual default.
  return new Set(['polygon']);
};

const layerSuffix: Record<GeoVisGeometryType, string> = {
  point: 'circle',
  line: 'line',
  polygon: 'fill',
  raster: 'raster',
  symbol: 'symbol',
  heatmap: 'heatmap',
};

const autoGenerateLayers = (
  data: ReadonlyArray<GeoVisDataEntry>
): VisualizationLayer[] => {
  const layers: VisualizationLayer[] = [];
  for (const entry of data) {
    const types = geometryTypesForEntry(entry);
    for (const geometry of types) {
      layers.push({
        id: `${entry.id}-${layerSuffix[geometry]}`,
        dataId: entry.id,
        geometry,
      });
    }
  }
  return layers;
};

/**
 * Normalises a partial `VisualizationSpec` by filling in default values for
 * every optional field, producing a fully-typed `VisualizationSpec` ready
 * for the engine adapter.
 *
 * Defaults applied:
 * - `id`     — derived from `data[0].id` (or `'geovis-spec'` when empty)
 * - `engine` — `'maplibre'`
 * - `view`   — bounding box of inline GeoJSON across `data`, falling back
 *              to a world view when no inline data is available
 * - `layers` — one layer per geometry type detected in each `data` entry
 *              (e.g. an inline source containing both polygons and points
 *              produces two layers, sharing the same `dataId`)
 *
 * Idempotent: calling `applyDefaults` on an already-complete spec returns
 * the same spec unchanged (no fields are overwritten when present).
 */
export const applyDefaults = (
  partial: PartialVisualizationSpec
): VisualizationSpec => {
  const data = partial.data ?? [];
  const id =
    partial.id ??
    data[0]?.id ??
    `geovis-${Math.random().toString(36).slice(2, 9)}`;
  const engine = partial.engine ?? 'maplibre';
  const view = partial.view ?? {
    ...computeBoundsFromSources(data),
    autoFit: true,
  };
  // When layerTemplates are present, defer layer generation to
  // expandLayerTemplates (called by GeoVisProvider after applyDefaults).
  // Auto-generating layers here would create duplicates.
  const layers =
    partial.layers && partial.layers.length > 0
      ? partial.layers
      : partial.layerTemplates && partial.layerTemplates.length > 0
        ? []
        : autoGenerateLayers(data);

  return {
    ...partial,
    id,
    engine,
    view,
    data,
    layers,
  };
};
