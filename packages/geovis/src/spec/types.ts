export type LngLat = [number, number];

export interface GeoJSONGeometry {
  type: string;
  coordinates?: unknown;
  geometries?: GeoJSONGeometry[];
}

export interface GeoJSONFeature {
  type: 'Feature';
  geometry: GeoJSONGeometry;
  properties?: Record<string, unknown>;
  id?: string | number;
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

export type GeoVisGeometryType =
  | 'point'
  | 'line'
  | 'polygon'
  | 'raster'
  | 'symbol'
  | 'heatmap';

export interface ViewState {
  center: LngLat;
  zoom: number;
  pitch?: number;
  bearing?: number;
  projection?: 'EPSG:3857' | 'EPSG:4326';
}

export interface GeoJSONSource {
  id: string;
  type: 'geojson';
  data: string | GeoJSONFeatureCollection;
  attribution?: string;
}

export interface VectorTileSource {
  id: string;
  type: 'vector-tiles';
  tiles: string[];
  sourceLayer?: string;
  minzoom?: number;
  maxzoom?: number;
  attribution?: string;
}

export interface RasterTileSource {
  id: string;
  type: 'raster-tiles';
  tiles: string[];
  tileSize?: 256 | 512;
  minzoom?: number;
  maxzoom?: number;
  attribution?: string;
}

export interface ImageSource {
  id: string;
  type: 'image';
  url: string;
  coordinates: [LngLat, LngLat, LngLat, LngLat];
  attribution?: string;
}

export type DataSource =
  | GeoJSONSource
  | VectorTileSource
  | RasterTileSource
  | ImageSource;

export interface FillPaint {
  fillColor?: string;
  fillOpacity?: number;
  lineColor?: string;
  lineWidth?: number;
}

export interface LinePaint {
  lineColor?: string;
  lineWidth?: number;
  lineOpacity?: number;
  lineDasharray?: number[];
}

export interface CirclePaint {
  circleColor?: string;
  circleRadius?: number;
  circleOpacity?: number;
  circleStrokeColor?: string;
  circleStrokeWidth?: number;
}

export interface RasterPaint {
  rasterOpacity?: number;
}

export type LayerPaint = FillPaint | LinePaint | CirclePaint | RasterPaint;

export interface VisualizationLayer {
  id: string;
  sourceId: string;
  geometry: GeoVisGeometryType;
  title?: string;
  visible?: boolean;
  minzoom?: number;
  maxzoom?: number;
  paint?: LayerPaint;
}

export interface BaseMapSpec {
  styleUrl?: string;
  attribution?: string;
}

export interface VisualizationSpec {
  id: string;
  title?: string;
  description?: string;
  engine: 'maplibre' | 'deckgl';
  view: ViewState;
  basemap?: BaseMapSpec;
  sources: DataSource[];
  layers: VisualizationLayer[];
  metadata?: Record<string, string | number | boolean>;
  adapterHints?: {
    maplibre?: {
      styleVersion?: 8;
    };
    openlayers?: {
      wrapX?: boolean;
    };
    deckgl?: {
      controller?: boolean;
    };
  };
}

export type GeovisSpec = VisualizationSpec;
