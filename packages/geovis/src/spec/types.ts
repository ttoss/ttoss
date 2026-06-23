import type { HoverTooltipConfig } from '../react/tooltip';
import type { LegendSpec } from './types.legend';

export * from './types.legend';

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
  center?: LngLat;
  zoom?: number;
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

/**
 * Proportional symbol configuration that maps the numeric `mapData` value
 * to `circle-radius` via MapLibre expressions.
 *
 * When `mode` is `'continuous'` (default), the radius is linearly interpolated
 * across the data range. A `sqrt` transform can be applied so that circle
 * **area** (not radius) is proportional to the value — both the input value
 * and the data bounds are transformed to sqrt space so output radii stay
 * within `[minRadius, maxRadius]`.
 *
 * When `mode` is `'stepped'`, the data range is split into discrete bins by
 * `thresholds` and each bin receives a fixed radius. The `sqrt` transform is
 * **not allowed** in stepped mode.
 */
export type SizeBy =
  | {
      /** Output radius range in pixels `[minRadius, maxRadius]`. Both must be > 0. */
      range: [number, number];
      /** Interpolation mode. Default (or omitted) is `'continuous'`. */
      mode?: 'continuous';
      /** Explicit break points. When omitted, thresholds are inherited from the active legend. */
      thresholds?: number[];
      /**
       * Radius transformation. Default: `'linear'`.
       * Use `'sqrt'` so circle AREA is proportional to the value.
       */
      transform?: 'linear' | 'sqrt';
    }
  | {
      /** Output radius range in pixels `[minRadius, maxRadius]`. Both must be > 0. */
      range: [number, number];
      /** Stepped mode: each bin receives a fixed radius. */
      mode: 'stepped';
      /** Explicit break points. When omitted, thresholds are inherited from the active legend. */
      thresholds?: number[];
      /** Only `'linear'` is allowed in stepped mode. */
      transform?: 'linear';
    };

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
  /** Optional alternative legend definitions presented as runtime toggles. */
  legends?: LegendSpec[];
  /** Id of the currently active legend from `legends[]`. */
  activeLegendId?: string;
  /**
   * Optional reference to an entry in `spec.mapData`.
   * When present, the layer can be styled/queried by per-feature `value`s
   * coming from the dataset (joined via `feature.id` or `mapData.joinKey`).
   */
  mapDataId?: string;
  /**
   * Paint applied via MapLibre `setFeatureState({ hover: true })` when the
   * pointer enters a feature. When present, the adapter adds a companion
   * line layer (`<id>-hover-outline`) driven by feature-state expressions.
   */
  hoverPaint?: { lineColor?: string; lineWidth?: number };
  /**
   * Paint applied via MapLibre `setFeatureState({ selected: true })` when a
   * feature is clicked. When present, the adapter adds a companion line layer
   * (`<id>-selected-outline`) driven by feature-state expressions.
   */
  selectedPaint?: { lineColor?: string; lineWidth?: number };
  /**
   * Spec-driven click marker. When present, geovis automatically places a
   * visual indicator on the clicked feature without requiring a `<GeoVisMarker>`
   * component. Three rendering modes — see field descriptions.
   */
  clickAnchor?: {
    /**
     * MapLibre sprite icon name. Renders a feature-state-driven companion
     * `symbol` layer at the polygon label point.
     */
    iconImage?: string;
    /** Scale factor for the sprite icon. Default: `1`. */
    iconSize?: number;
    /**
     * Accent colour for the built-in SVG pin. Applied when `iconImage` is not
     * set. Default: `'#3FB1CE'`. For a custom HTML/React element, use
     * `<GeoVisMarker>` instead.
     */
    color?: string;
    /** Pixel offset `[x, y]` applied to the DOM marker. */
    offset?: [number, number];
  };
  /**
   * Spec-driven hover tooltip. When present, `<GeoVisProvider>` automatically
   * renders a `<GeoVisHoverTooltip>` for features hovered on this layer —
   * without requiring the component to be placed in the tree. Mirrors
   * `GeoVisHoverTooltipProps` (`render`, `formatValue`, `style`, `offset`,
   * `emptyValueLabel`, `className`). An empty object (`{}`) opts in to the
   * default tooltip layout. Typed via a type-only import so the data-only
   * spec layer keeps no runtime dependency on React.
   */
  hoverTooltip?: HoverTooltipConfig;
  /**
   * Proportional symbol configuration. When present on a point layer,
   * `circle-radius` is driven by a data expression instead of a static value.
   * Ignored on non-point geometries.
   */
  sizeBy?: SizeBy;
}

/**
 * One row of attribute data joined to a geometry feature.
 * `geometryId` matches `feature.id` (default) or `feature.properties[joinKey]`
 * when `joinKey` is declared on the parent `MapData`.
 */
export interface MapDataRow {
  geometryId: string | number;
  value: number | string | null;
}

/**
 * Attribute dataset attached to a geojson source.
 * Decouples geometry (in `sources[]`) from values, so the same geometry
 * can be reused with multiple datasets, and values can be mutated
 * independently from features.
 */
export interface MapData {
  mapDataId: string;
  /** FK to `sources[].id` of a `geojson` source. */
  mapId: string;
  title?: string;
  description?: string;
  /**
   * Property name on each feature used to match `data[].geometryId`.
   * Defaults to using `feature.id` when omitted.
   */
  joinKey?: string;
  /**
   * Feature-state key name used when applying this dataset via `setFeatureState`.
   * Defaults to `'value'` for backward compatibility.
   */
  stateKey?: string;
  /**
   * Visual dimension this dataset drives. When set, the adapter auto-discovers
   * which dataset provides color vs. size for each layer, eliminating the need
   * for layer-level `mapDataColor`/`mapDataSize` references.
   * Two datasets on the same source must use different `dimension` values.
   */
  dimension?: 'color' | 'size';
  data: MapDataRow[];
}

export interface BaseMapSpec {
  styleUrl?: string;
  attribution?: string;
  /**
   * When `false`, the basemap tiles are hidden — the map renders with a blank
   * background. GeoJSON layers remain fully interactive.
   * Defaults to `true`.
   */
  visible?: boolean;
}

/**
 * Declares one visual perspective of a spec in a multi-view layout.
 * Each view references a subset of `spec.layers` by id and is intended to be
 * consumed by layout components that derive per-panel specs and manage view
 * synchronisation automatically.
 */
export interface VisualizationView {
  /** Unique view identifier. Must match the `viewId` prop of `GeoVisCanvas`. */
  id: string;
  /** Human-readable label rendered above the canvas by layout components. */
  label?: string;
  /**
   * Layer ids from `spec.layers` that this view displays.
   *
   * @remarks
   * No runtime validation is performed — IDs that do not match any entry in
   * `spec.layers` are silently ignored, resulting in an empty render for that
   * view. Ensure every id listed here corresponds to a layer defined in the
   * top-level `spec.layers` array.
   */
  layers: string[];
}

export interface VisualizationSpec {
  id: string;
  title?: string;
  description?: string;
  engine: 'maplibre';
  view?: ViewState;
  basemap?: BaseMapSpec;
  sources: DataSource[];
  layers: VisualizationLayer[];
  /** Optional top-level legend registry used by legend UI components. */
  legends?: LegendSpec[];
  /**
   * Optional attribute datasets joined to geojson sources.
   * Each entry references a source via `mapId` and provides
   * per-feature `value`s for use in styling, tooltips, charts.
   */
  mapData?: MapData[];
  metadata?: Record<string, unknown>;
  /**
   * @deprecated No longer used by the adapter. Kept for backward compatibility
   * so existing specs continue to pass `validateSpec()`. Will be removed in a
   * future breaking-change release.
   */
  adapterHints?: unknown;
}

export type GeovisSpec = VisualizationSpec;

export interface PolicyViolation {
  /** Identifies the violated policy rule. */
  reason: string;
  /** Human-readable explanation surfaced to the consumer. */
  message: string;
}
