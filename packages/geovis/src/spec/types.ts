export type LngLat = [number, number];

export type GeoJSONPosition = [number, number] | [number, number, number];

export type GeoJSONBoundingBox =
  | [number, number, number, number]
  | [number, number, number, number, number, number];

export interface GeoJSONPoint {
  type: 'Point';
  coordinates: GeoJSONPosition;
  bbox?: GeoJSONBoundingBox;
}

export interface GeoJSONMultiPoint {
  type: 'MultiPoint';
  coordinates: GeoJSONPosition[];
  bbox?: GeoJSONBoundingBox;
}

export interface GeoJSONLineString {
  type: 'LineString';
  coordinates: GeoJSONPosition[];
  bbox?: GeoJSONBoundingBox;
}

export interface GeoJSONMultiLineString {
  type: 'MultiLineString';
  coordinates: GeoJSONPosition[][];
  bbox?: GeoJSONBoundingBox;
}

export interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: GeoJSONPosition[][];
  bbox?: GeoJSONBoundingBox;
}

export interface GeoJSONMultiPolygon {
  type: 'MultiPolygon';
  coordinates: GeoJSONPosition[][][];
  bbox?: GeoJSONBoundingBox;
}

export interface GeoJSONGeometryCollection {
  type: 'GeometryCollection';
  geometries: GeoJSONGeometry[];
  bbox?: GeoJSONBoundingBox;
}

export type GeoJSONGeometry =
  | GeoJSONPoint
  | GeoJSONMultiPoint
  | GeoJSONLineString
  | GeoJSONMultiLineString
  | GeoJSONPolygon
  | GeoJSONMultiPolygon
  | GeoJSONGeometryCollection;

export interface GeoJSONFeature {
  type: 'Feature';
  geometry: GeoJSONGeometry | null;
  properties: Record<string, unknown> | null;
  id?: string | number;
  bbox?: GeoJSONBoundingBox;
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
  bbox?: GeoJSONBoundingBox;
}

export type GeoJSONObject =
  | GeoJSONGeometry
  | GeoJSONFeature
  | GeoJSONFeatureCollection;

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
  projection?: 'mercator' | 'vertical-perspective';
}

export interface GeoJSONSource {
  id: string;
  type: 'geojson';
  data: string | GeoJSONObject;
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

export interface RasterDemSource {
  id: string;
  type: 'raster-dem';
  tiles?: string[];
  url?: string;
  tileSize?: number;
  minzoom?: number;
  maxzoom?: number;
  attribution?: string;
  encoding?: 'mapbox' | 'terrarium' | 'custom';
}

export interface VideoSource {
  id: string;
  type: 'video';
  urls: string[];
  coordinates: [LngLat, LngLat, LngLat, LngLat];
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
  | RasterDemSource
  | VideoSource
  | ImageSource;

export interface FillPaint {
  fillColor?: string;
  fillOpacity?: number;
  lineColor?: string;
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

export interface HeatmapPaint {
  /** Radius of influence of each data point, in pixels. Default: 15. */
  heatmapRadius?: number;
  /** Similar to `circleOpacity` — controls overall layer opacity. Default: 1. */
  heatmapOpacity?: number;
  /** Multiplier applied to each pixel's weight. Default: 1. */
  heatmapIntensity?: number;
  /** Individual data point contribution weight. Default: 1. */
  heatmapWeight?: number;
}

export interface SymbolPaint {
  // Paint properties
  textColor?: string;
  textOpacity?: number;
  textHaloColor?: string;
  textHaloWidth?: number;
  iconColor?: string;
  iconOpacity?: number;
  // Layout properties (GeoVis treats them uniformly in the paint bag)
  textField?: string;
  textSize?: number;
  iconImage?: string;
}

export type LayerPaint =
  | FillPaint
  | LinePaint
  | CirclePaint
  | RasterPaint
  | HeatmapPaint
  | SymbolPaint;

export interface VisualizationLayer {
  id: string;
  sourceId: string;
  geometry: GeoVisGeometryType;
  sourceLayer?: string;
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

/**
 * Declares one visual perspective of a spec in a multi-view layout.
 * Each view references a subset of `spec.layers` by id.
 * Layout components (e.g. `GeoVisSplitLayout`) read this field to derive
 * per-panel specs and manage synchronization automatically.
 */
export interface VisualizationView {
  /** Unique view identifier. Must match the `viewId` prop of `GeoVisCanvas`. */
  id: string;
  /** Human-readable label rendered above the canvas by layout components. */
  label?: string;
  /** Layer ids from `spec.layers` that this view displays. */
  layers: string[];
}

export interface VisualizationSpec {
  id: string;
  title?: string;
  description?: string;
  engine: 'maplibre';
  view: ViewState;
  basemap?: BaseMapSpec;
  sources: DataSource[];
  layers: VisualizationLayer[];
  /**
   * Optional array of views for multi-panel layouts.
   * When present, layout components derive one spec per view by
   * filtering `layers` to those listed in each view's `layers` array.
   */
  views?: VisualizationView[];
  metadata?: Record<string, unknown>;
  adapterHints?: {
    maplibre?: {
      styleVersion?: 8;
    };
  };
}

export type GeovisSpec = VisualizationSpec;

export interface PolicyViolation {
  /** Identifies the violated policy rule. */
  reason: string;
  /** Human-readable explanation surfaced to the consumer. */
  message: string;
}
