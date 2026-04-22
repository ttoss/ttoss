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
  /**
   * When `true`, the engine adapter will refine `center`/`zoom` once data
   * sources finish loading by calling its native `fitBounds` equivalent.
   * Set automatically by `applyDefaults` when the spec did not include an
   * explicit `view`. User-provided views are never auto-fit.
   */
  autoFit?: boolean;
}

/**
 * Inline GeoJSON object embedded directly in the spec.
 */
export interface GeoJSONInlineData {
  id: string;
  kind: 'geojson-inline';
  geojson: GeoJSONObject;
  attribution?: string;
}

/**
 * Remote GeoJSON loaded by the engine from `url`.
 */
export interface GeoJSONUrlData {
  id: string;
  kind: 'geojson-url';
  url: string;
  attribution?: string;
}

/**
 * Vector tile source (MVT / TileJSON).
 */
export interface VectorTilesData {
  id: string;
  kind: 'vector-tiles';
  tiles: string[];
  /** Source-layer name used as a default for layers that reference this entry. */
  sourceLayer?: string;
  minzoom?: number;
  maxzoom?: number;
  attribution?: string;
}

/**
 * Raster tile source (PNG, JPEG, WEBP).
 */
export interface RasterTilesData {
  id: string;
  kind: 'raster-tiles';
  tiles: string[];
  tileSize?: 256 | 512;
  minzoom?: number;
  maxzoom?: number;
  attribution?: string;
}

/**
 * Terrain / elevation raster-DEM source.
 */
export interface RasterDemData {
  id: string;
  kind: 'raster-dem';
  url?: string;
  tiles?: string[];
  tileSize?: number;
  minzoom?: number;
  maxzoom?: number;
  attribution?: string;
  encoding?: 'mapbox' | 'terrarium' | 'custom';
}

/**
 * Georeferenced raster image draped over four corner coordinates.
 */
export interface ImageData {
  id: string;
  kind: 'image';
  url: string;
  coordinates: [LngLat, LngLat, LngLat, LngLat];
  attribution?: string;
}

/**
 * Video source draped over four corner coordinates.
 */
export interface VideoData {
  id: string;
  kind: 'video';
  urls: string[];
  coordinates: [LngLat, LngLat, LngLat, LngLat];
}

/**
 * Engine-native escape hatch. When `engine` matches the spec engine, the
 * adapter injects `spec` verbatim into the engine without any translation.
 * Use this for formats not yet covered by the typed variants (e.g. PMTiles).
 */
export interface NativeData {
  id: string;
  kind: 'native';
  /** Engine identifier this spec is written for (e.g. `'maplibre'`). */
  engine: string;
  /** Engine-native source specification passed through verbatim. */
  spec: Record<string, unknown>;
}

/**
 * Discriminated union of all data entry types understood by GeoVis.
 * The `kind` field is the discriminant; `id` is shared by all variants and
 * referenced by `VisualizationLayer.dataId`.
 */
export type GeoVisDataEntry =
  | GeoJSONInlineData
  | GeoJSONUrlData
  | VectorTilesData
  | RasterTilesData
  | RasterDemData
  | ImageData
  | VideoData
  | NativeData;

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
  /** References `VisualizationSpec.data[].id`. */
  dataId: string;
  geometry: GeoVisGeometryType;
  sourceLayer?: string;
  title?: string;
  visible?: boolean;
  minzoom?: number;
  maxzoom?: number;
  paint?: LayerPaint;
  /**
   * @description Feature property used as the primary label/identifier for rendered
   * features (tooltips, popups, symbol text). Example: `"nm_subpref"`.
   */
  labelProperty?: string;
  /**
   * Ordered list of feature property names that should be displayed by
   * consumers (e.g. tooltips, popups, side panels). Each entry must match
   * a property that exists in the layer's source features.
   */
  displayProperties?: string[];
  /**
   * Optional map of property -> human-friendly label, typically resolved from
   * `spec.metadata.displayPropertyLabels` during template expansion.
   */
  displayPropertyLabels?: Record<string, string>;
  /**
   * @description Data-driven color configuration. When provided, the adapter derives
   * paint colors from feature properties using the declared scheme.
   */
  colorBy?: ColorBy;
  /**
   * @description Alternative color/legend configurations. Intended for UIs that allow
   * the user to switch between multiple visual encodings of the same layer.
   */
  legends?: LegendSpec[];
  /**
   * Id of the entry in `legends` that should be active by default.
   * Must match one of `legends[].id`.
   */
  activeLegendId?: string;
}

/**
 * Declarative template that expands into N concrete `VisualizationLayer`
 * entries — one per entry in `properties`. Use `expandLayerTemplates(spec)`
 * to materialize the expansion before feeding the spec to the adapter.
 *
 * Each expanded layer is identified by `layerIdPattern` (default:
 * `"${templateId}-${property}"`). When `generateViews` is true, a
 * `VisualizationView` is also emitted for each expanded layer, using
 * `viewIdPattern` (default: same as the layer id).
 *
 * Pattern placeholders resolved by the expander:
 * - `${templateId}` → the template id
 * - `${property}`   → the current property name (e.g. `c1`)
 * - `${label}`      → the label resolved from
 *                     `spec.metadata.displayPropertyLabels[property]`,
 *                     falling back to the property name
 */
export interface LayerTemplate {
  /** Geometry type applied to every expanded layer. */
  geometry: GeoVisGeometryType;
  /**
   * Ordered list of feature property names driving the expansion. One layer
   * (and optionally one view) is emitted per entry. Every entry must be
   * present in at least one feature of the referenced source.
   *
   * When omitted, falls back to `displayProperties`. This allows declaring
   * the list only once when the same properties both drive the visualizations
   * and appear in the info panel.
   */
  properties?: string[];
  /** Label property applied to every expansion (same value for all). */
  labelProperty: string;
  /** Display properties applied to every expansion (same list for all). */
  displayProperties: string[];
  /**
   * Optional template identifier (not a layer id). When omitted, the
   * expander generates one based on the template index (`template${i}`).
   */
  id?: string;
  /**
   * Source consumed by every expanded layer. When omitted, defaults to
   * the id of the first entry in `spec.data`.
   */
  dataId?: string;
  /** Optional source-layer filter applied to every expansion. */
  sourceLayer?: string;
  /** Initial visibility applied to every expansion. */
  visible?: boolean;
  /** Minimum zoom applied to every expansion. */
  minzoom?: number;
  /** Maximum zoom applied to every expansion. */
  maxzoom?: number;
  /** Static paint applied to every expansion. */
  paint?: LayerPaint;
  /**
   * Color-by template whose `property` is injected per expansion from
   * `properties[i]`. When omitted, defaults to `{ type: 'categorical' }`.
   */
  colorBy?: ColorByTemplate;
  /** When true, also emits one `VisualizationView` per expanded layer. */
  generateViews?: boolean;
  /** Pattern for expanded layer ids. Defaults to `"${templateId}-${property}"`. */
  layerIdPattern?: string;
  /** Pattern for expanded view ids. Defaults to the generated layer id. */
  viewIdPattern?: string;
  /** Pattern for expanded layer `title` and view `label`. Defaults to `"${label}"`. */
  labelPattern?: string;
  /**
   * Presentation hint copied to `spec.presentation` after expansion (only if
   * the spec did not already declare one). Lets a template declare its
   * preferred display mode for the views it generates.
   */
  presentation?: PresentationMode;
}

export interface BaseMapSpec {
  styleUrl?: string;
  attribution?: string;
}

/**
 * How a multi-view spec should be presented to the user. Engine-agnostic:
 * the React layer (`<GeoVisViews>`) reads it and picks a UI pattern.
 * Defaults to `'tabs'` when omitted.
 *
 * Supported modes:
 * - `'tabs'` (default): one map at a time, switched via tab/select bar.
 * - `'side-by-side'`: small-multiples grid, all views mounted simultaneously.
 *   Useful for comparing the same geography across N variables.
 * - `'single-filter'`: one map with N selectable encodings; only the active
 *   layer is visible (others kept hidden). Cheaper than `tabs` because the
 *   map is mounted once and only paint/visibility is toggled.
 * - `'time-slider'`: one map driven by a temporal slider; the active view is
 *   chosen by the slider position. Each view typically represents one time
 *   step (e.g. yearly population).
 *
 * Other modes considered for future extensions (NOT implemented yet):
 * - `'swipe-compare'`: two views, divided by a draggable curtain.
 * - `'picture-in-picture'`: main view + minimap inset for context.
 * - `'animation'`: cycles through views automatically (looping playback).
 * - `'story-step'`: scrollytelling — view changes as the user scrolls.
 * - `'sync-pan-zoom'`: side-by-side with linked camera state.
 * - `'overlay'`: views layered on the same canvas with opacity blending.
 */
export type PresentationMode =
  | 'tabs'
  | 'side-by-side'
  | 'single-filter'
  | 'time-slider';

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
  data: GeoVisDataEntry[];
  layers?: VisualizationLayer[];
  /**
   * Optional array of views for multi-panel layouts.
   * When present, layout components derive one spec per view by
   * filtering `layers` to those listed in each view's `layers` array.
   */
  views?: VisualizationView[];
  /**
   * Declarative templates that expand into concrete `layers` and `views`.
   * Processed by `expandLayerTemplates` (called automatically by `GeoVisProvider`).
   * Removed from the spec after expansion.
   */
  layerTemplates?: LayerTemplate[];
  /** Hint to UI consumers about how to render multiple views. */
  presentation?: PresentationMode;
  metadata?: Record<string, unknown>;
  adapterHints?: {
    maplibre?: {
      styleVersion?: 8;
    };
  };
}

export interface PolicyViolation {
  /** Identifies the violated policy rule. */
  reason: string;
  /** Human-readable explanation surfaced to the consumer. */
  message: string;
}
