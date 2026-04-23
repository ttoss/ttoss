import { computeBoundsFromSources } from './computeBoundsFromSources';
import type {
  BaseMapSpec,
  GeoJSONFeatureCollection,
  GeoJSONObject,
  GeoJSONUrlData,
  GeoVisDataEntry,
  GeoVisGeometryType,
  PresentationMode,
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
  // raster-dem sources are intended for hillshade layers; video sources
  // render as raster — neither maps safely to a GeoVis geometry default,
  // so no layer is auto-generated for them.
  if (entry.kind === 'raster-dem' || entry.kind === 'video') {
    return new Set();
  }
  // `geojson-url`: geometry resolved at runtime via fetchUrlGeometryTypes when
  // applyDefaultsAsync is used. Sync path defaults to polygon.
  // `vector-tiles` and `native` cannot be inferred — polygon is the fallback.
  return new Set(['polygon']);
};

/**
 * Fetches a remote GeoJSON URL and returns the geometry types found by
 * sampling the first feature(s). Falls back to `polygon` on any network
 * or parse error so that the spec stays renderable.
 */
const fetchUrlGeometryTypes = async (
  entry: GeoJSONUrlData
): Promise<Set<GeoVisGeometryType>> => {
  try {
    const res = await fetch(entry.url);
    if (!res.ok) return new Set(['polygon']);
    const geojson = (await res.json()) as GeoJSONObject;
    const types = collectInlineGeometryTypes(geojson);
    return types.size > 0 ? types : new Set(['polygon']);
  } catch {
    return new Set(['polygon']);
  }
};

const layerSuffix: Record<GeoVisGeometryType, string> = {
  point: 'circle',
  line: 'line',
  polygon: 'fill',
  raster: 'raster',
  symbol: 'symbol',
  heatmap: 'heatmap',
};

/**
 * Infers a sensible default basemap when the caller did not declare one.
 *
 * Decision table (evaluated in order, first match wins):
 * 1. Any data entry is `raster-tiles`, `raster-dem`, or `image` → `none: true`
 *    (the data itself is the visual context; a basemap would be hidden anyway).
 * 2. `presentation` is `'side-by-side'` or `'time-slider'` → neutral `positron`
 *    (comparison UIs need a low-contrast, identical background across panels).
 * 3. Default → `bright` (general-purpose basemap with streets and labels).
 */
export const inferBasemap = ({
  data,
  presentation,
}: {
  data: ReadonlyArray<GeoVisDataEntry>;
  presentation?: PresentationMode;
}): BaseMapSpec => {
  const isRasterDominant = data.some((e) => {
    return (
      e.kind === 'raster-tiles' || e.kind === 'raster-dem' || e.kind === 'image'
    );
  });
  if (isRasterDominant) return { none: true };

  if (presentation === 'side-by-side' || presentation === 'time-slider') {
    return { styleUrl: 'https://tiles.openfreemap.org/styles/positron' };
  }

  return { styleUrl: 'https://tiles.openfreemap.org/styles/bright' };
};

const autoGenerateLayers = (
  data: ReadonlyArray<GeoVisDataEntry>,
  urlHints: Map<string, Set<GeoVisGeometryType>> = new Map()
): VisualizationLayer[] => {
  const layers: VisualizationLayer[] = [];
  for (const entry of data) {
    const types =
      entry.kind === 'geojson-url' && urlHints.has(entry.id)
        ? (urlHints.get(entry.id) as Set<GeoVisGeometryType>)
        : geometryTypesForEntry(entry);
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
 *
 * For specs with `geojson-url` data entries, use `applyDefaultsAsync` to
 * infer the correct geometry type by fetching the URL before auto-generating
 * layers. The sync version defaults to `polygon` for URL entries.
 */
const applyDefaultsCore = (
  partial: PartialVisualizationSpec,
  urlHints: Map<string, Set<GeoVisGeometryType>>
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
        : autoGenerateLayers(data, urlHints);
  const basemap =
    partial.basemap ??
    inferBasemap({ data, presentation: partial.presentation });

  return {
    ...partial,
    id,
    engine,
    view,
    data,
    layers,
    basemap,
  };
};

export const applyDefaults = (
  partial: PartialVisualizationSpec
): VisualizationSpec => {
  return applyDefaultsCore(partial, new Map());
};

/**
 * Async variant of `applyDefaults` that resolves the geometry type of
 * `geojson-url` data entries by fetching each URL and sampling its features
 * before auto-generating layers.
 *
 * Only fires URL requests when layers would be auto-generated (i.e. no
 * explicit `layers` or `layerTemplates` are present). Falls back to
 * `polygon` on any network or parse failure so the spec stays renderable.
 *
 * Entries that still cannot be inferred even after URL fetching:
 * - `vector-tiles` — geometry is embedded in binary tile content; a
 *   TileJSON `vector_layers` field could be consulted in a future extension.
 * - `native`       — opaque engine-specific format, no generic inference path.
 */
export const applyDefaultsAsync = async (
  partial: PartialVisualizationSpec
): Promise<VisualizationSpec> => {
  const data = partial.data ?? [];
  const willAutoGenerate =
    !partial.layers?.length && !partial.layerTemplates?.length;

  const urlHints = new Map<string, Set<GeoVisGeometryType>>();

  if (willAutoGenerate) {
    await Promise.all(
      data
        .filter((e): e is GeoJSONUrlData => {
          return e.kind === 'geojson-url';
        })
        .map(async (entry) => {
          urlHints.set(entry.id, await fetchUrlGeometryTypes(entry));
        })
    );
  }

  return applyDefaultsCore(partial, urlHints);
};
