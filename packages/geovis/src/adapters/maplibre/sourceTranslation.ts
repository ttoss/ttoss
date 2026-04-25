import type maplibregl from 'maplibre-gl';

import type { DataSource } from '../../spec/types';

type MaplibreSourceSpec = maplibregl.SourceSpecification;

const sourceConverters: Record<
  DataSource['type'],
  (s: never) => MaplibreSourceSpec
> = {
  geojson: (source: DataSource & { type: 'geojson' }) => {
    return {
      type: 'geojson',
      data: source.data as maplibregl.GeoJSONSourceSpecification['data'],
      attribution: source.attribution,
    };
  },
  'vector-tiles': (source: DataSource & { type: 'vector-tiles' }) => {
    return {
      type: 'vector',
      tiles: source.tiles,
      minzoom: source.minzoom,
      maxzoom: source.maxzoom,
      attribution: source.attribution,
    };
  },
  'raster-tiles': (source: DataSource & { type: 'raster-tiles' }) => {
    return {
      type: 'raster',
      tiles: source.tiles,
      tileSize: source.tileSize ?? 256,
      minzoom: source.minzoom,
      maxzoom: source.maxzoom,
      attribution: source.attribution,
    };
  },
  image: (source: DataSource & { type: 'image' }) => {
    return {
      type: 'image',
      url: source.url,
      coordinates: source.coordinates,
    };
  },
  'raster-dem': (source: DataSource & { type: 'raster-dem' }) => {
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
  video: (source: DataSource & { type: 'video' }) => {
    return {
      type: 'video',
      urls: source.urls,
      coordinates: source.coordinates,
    };
  },
};

/**
 * Translates a GeoVis `DataSource` into the corresponding MapLibre
 * `SourceSpecification` object.
 *
 * @remarks
 * This function is the sole translation boundary between the GeoVis source
 * model and the MapLibre API. Each source type has a dedicated converter in
 * `sourceConverters` — adding a new source type only requires a new entry
 * there, with no branching logic needed here.
 *
 * @param source - A source entry from `VisualizationSpec.sources`.
 * @returns A MapLibre-ready `SourceSpecification` for `map.addSource()`.
 */
export const toMaplibreSource = (source: DataSource): MaplibreSourceSpec => {
  const fn = sourceConverters[source.type] as (
    s: DataSource
  ) => MaplibreSourceSpec;
  return fn(source);
};
