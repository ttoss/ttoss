import type maplibregl from 'maplibre-gl';

import type { DataSource, VisualizationSpec } from '../../spec/types';

type MaplibreSourceSpec = maplibregl.SourceSpecification;

const sourceConverters: Record<
  DataSource['type'],
  (s: never, opts: { promoteId?: string }) => MaplibreSourceSpec
> = {
  geojson: (
    source: DataSource & { type: 'geojson' },
    opts: { promoteId?: string }
  ) => {
    return {
      type: 'geojson',
      data: source.data as maplibregl.GeoJSONSourceSpecification['data'],
      attribution: source.attribution,
      // `promoteId` lifts a feature property to the synthetic `feature.id`
      // used by `setFeatureState`. Required when the underlying GeoJSON has
      // duplicate or missing ids and a `mapData.joinKey` identifies the row.
      // Without it, all features collapse to `id: 0` and `setFeatureState`
      // overwrites itself, producing a single colour for the whole layer.
      ...(opts.promoteId ? { promoteId: opts.promoteId } : {}),
    };
  },
  'vector-tiles': (
    source: DataSource & { type: 'vector-tiles' },
    opts: { promoteId?: string }
  ) => {
    return {
      type: 'vector',
      tiles: source.tiles,
      minzoom: source.minzoom,
      maxzoom: source.maxzoom,
      attribution: source.attribution,
      ...(opts.promoteId ? { promoteId: opts.promoteId } : {}),
    };
  },
  'raster-tiles': (
    source: DataSource & { type: 'raster-tiles' },
    _opts: { promoteId?: string }
  ) => {
    return {
      type: 'raster',
      tiles: source.tiles,
      tileSize: source.tileSize ?? 256,
      minzoom: source.minzoom,
      maxzoom: source.maxzoom,
      attribution: source.attribution,
    };
  },
  image: (
    source: DataSource & { type: 'image' },
    _opts: { promoteId?: string }
  ) => {
    return {
      type: 'image',
      url: source.url,
      coordinates: source.coordinates,
    };
  },
  'raster-dem': (
    source: DataSource & { type: 'raster-dem' },
    _opts: { promoteId?: string }
  ) => {
    return {
      type: 'raster-dem',
      tiles: source.tiles,
      url: source.url,
      tileSize: source.tileSize ?? 256,
      encoding: source.encoding,
      minzoom: source.minzoom,
      maxzoom: source.maxzoom,
      attribution: source.attribution,
    };
  },
  video: (
    source: DataSource & { type: 'video' },
    _opts: { promoteId?: string }
  ) => {
    return {
      type: 'video',
      urls: source.urls,
      coordinates: source.coordinates,
    };
  },
};

/**
 * Translates a GeoVis `DataSource` into the corresponding MapLibre `SourceSpecification`.
 * Sole translation boundary between the GeoVis source model and MapLibre.
 *
 * `opts.promoteId` is forwarded to source types that support it (geojson,
 * vector). It must be derived from `spec.mapData[].joinKey` so feature-state
 * lookups by joinKey value resolve to the correct MapLibre `feature.id`.
 */
export const toMaplibreSource = (
  source: DataSource,
  opts: { promoteId?: string } = {}
): MaplibreSourceSpec => {
  const fn = sourceConverters[source.type] as (
    s: DataSource,
    o: { promoteId?: string }
  ) => MaplibreSourceSpec;
  return fn(source, opts);
};

/**
 * Returns the `promoteId` to apply when adding a source to the map, derived
 * from any `spec.mapData[]` entry that targets the source via `joinKey`.
 *
 * MapLibre only accepts a single `promoteId` per source. If multiple
 * `mapData` entries reference the same source with different `joinKey`s,
 * the FIRST entry wins. Callers should align all `mapData` entries on a
 * given source to the same `joinKey` to avoid silent mismatches.
 */
export const resolvePromoteIdForSource = (
  spec: VisualizationSpec,
  sourceId: string
): string | undefined => {
  for (const entry of spec.mapData ?? []) {
    if (entry.mapId === sourceId && entry.joinKey) return entry.joinKey;
  }
  return undefined;
};
