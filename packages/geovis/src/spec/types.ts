import type { LayerClickConfig } from '../react/click';
import type { HoverTooltipConfig } from '../react/tooltip';
import type { LegendPosition, LegendSpec } from './types.legend';

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
  GeoJSONGeometry | GeoJSONFeature | GeoJSONFeatureCollection;

export type GeoVisGeometryType =
  'point' | 'line' | 'polygon' | 'raster' | 'symbol' | 'heatmap';

export type MapType = 'choropleth' | 'dotDensity' | 'proportionalCircles';

export interface ViewState {
  center?: LngLat;
  zoom?: number;
  /**
   * Highest zoom level the user can reach by zooming in. Acts as a camera
   * ceiling: interactive zoom, `setView`, and programmatic `zoom` are all
   * clamped to this value. Higher numbers mean closer to the ground. When
   * omitted, MapLibre's default maximum (`22`) applies.
   */
  maxZoomIn?: number;
  /**
   * Lowest zoom level the user can reach by zooming out. Acts as a camera
   * floor: interactive zoom, `setView`, and programmatic `zoom` are all
   * clamped to this value. Lower numbers mean farther from the ground. When
   * omitted, MapLibre's default minimum (`0`) applies.
   */
  maxZoomOut?: number;
  pitch?: number;
  bearing?: number;
  /**
   * Eases the camera, over this many milliseconds, when `pitch` or `bearing`
   * changes from one spec to the next — tilting into a 3D view rather than
   * snapping to it. Omit it (or `0`) to jump, as before. Centre and zoom
   * changes still jump. A viewer's reduced-motion setting turns the ease into a
   * jump.
   */
  cameraAngleTransitionMs?: number;
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
  circleStrokeOpacity?: number;
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

/**
 * A MapLibre expression: an operator followed by its arguments. Declared
 * because the adapter hands `paint` straight to the style — the JSON schema
 * types `layer.paint` as `additionalProperties: true`, so an expression both
 * validates and reaches `text-field`/`text-size` intact. Only these two
 * declarations were narrower than what the adapter already passed through.
 *
 * @example
 * ```typescript
 * const textField: SymbolExpression = ['get', 'count'];
 * ```
 */
export type SymbolExpression = [string, ...unknown[]];

export interface SymbolPaint {
  // Paint properties
  textColor?: string;
  textOpacity?: number;
  textHaloColor?: string;
  textHaloWidth?: number;
  iconColor?: string;
  iconOpacity?: number;
  // Layout properties (GeoVis treats them uniformly in the paint bag)
  /**
   * The label's text. A `{property}` token, a literal, or a
   * {@link SymbolExpression} when the label has to be computed per feature
   * (formatting a count, picking between properties).
   */
  textField?: string | SymbolExpression;
  /**
   * Label size in pixels, or a {@link SymbolExpression} to drive it from a
   * feature property (`['step', ['get', 'count'], 11, 100, 14]`).
   */
  textSize?: number | SymbolExpression;
  /**
   * Fontstack the glyphs are requested from. Defaults to
   * `['Noto Sans Regular']`, which OpenFreeMap and most OpenMapTiles-derived
   * basemaps serve — MapLibre's own default (`Open Sans Regular`,
   * `Arial Unicode MS Regular`) is served by neither, and a missing fontstack
   * 404s the glyph request and rasterizes no text at all.
   *
   * @default ['Noto Sans Regular']
   */
  textFont?: string[];
  /**
   * Image drawn at each feature: the `id` of a {@link ImageSpec} in
   * `spec.images`, or the name of an icon in the basemap's sprite.
   */
  iconImage?: string;
  /** Scale factor applied to the image. @default 1 */
  iconSize?: number;
  /**
   * Which part of the image sits on the feature's coordinate. A pin
   * ({@link PinImage}) points with its bottom tip, so it takes `'bottom'`;
   * MapLibre's default, `'center'`, would leave it floating half its height
   * above the place it marks.
   *
   * @default 'center'
   */
  iconAnchor?:
    | 'center'
    | 'left'
    | 'right'
    | 'top'
    | 'bottom'
    | 'top-left'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-right';
  /** Offset of the image from its anchor, in pixels `[x, y]`. */
  iconOffset?: [number, number];
  /**
   * Whether an image stays drawn when it collides with another. MapLibre
   * hides colliding symbols by default, which is right for labels but drops
   * markers of neighbouring places — set `true` to keep every one.
   *
   * @default false
   */
  iconAllowOverlap?: boolean;
}

/**
 * A map pin: a teardrop in `color` with an icon drawn inside it. GeoVis builds
 * the image itself and registers it on the map under `id`, so a `symbol` layer
 * shows it with `paint.iconImage: id`.
 *
 * @example
 * ```typescript
 * const pin: PinImage = {
 *   id: 'hospital-pin',
 *   kind: 'pin',
 *   icon: 'maki:hospital',
 *   color: '#C0392B',
 * };
 * ```
 */
export interface PinImage {
  /** Name the image is registered under — what `paint.iconImage` refers to. */
  id: string;
  kind: 'pin';
  /**
   * `@ttoss/react-icons` (Iconify) name of the icon drawn inside the pin, e.g.
   * `'maki:hospital'`. Resolved from the icons registered with `addIcon`, or
   * fetched from the Iconify API when it is not registered.
   */
  icon: string;
  /** Fill colour of the pin. */
  color: string;
  /** Colour of the icon inside the pin. @default '#ffffff' */
  iconColor?: string;
  /** Pin width in CSS pixels; its height follows the teardrop's shape. @default 28 */
  size?: number;
}

/**
 * An image GeoVis registers on the map for `symbol` layers to draw, declared
 * in `spec.images`. Only pins today; the `kind` discriminant leaves room for
 * other image kinds.
 */
export type ImageSpec = PinImage;

export type LayerPaint =
  | FillPaint
  | LinePaint
  | CirclePaint
  | RasterPaint
  | HeatmapPaint
  | SymbolPaint;

/**
 * 3D extrusion of a polygon layer: each feature rises into a prism whose
 * height follows the same `mapData` value its colour does, so darker classes
 * stand taller. The geometry is the source's own 2D polygons — no height in
 * the GeoJSON; MapLibre lifts them at render time (`fill-extrusion`).
 *
 * In `'class'` mode (default) every class of the active threshold legend gets
 * its own height — evenly stepped up to `maxHeight`, or the explicit `heights`
 * — so a prism's height and colour always tell the same class. In
 * `'continuous'` mode the height is proportional to the value: `0` stands flat,
 * the dataset's largest value stands `maxHeight` tall. A `'class'` layer whose
 * active legend has no thresholds falls back to `'continuous'`.
 *
 * Features without a value stay flat (height `0`). Heights are in metres. The
 * effect reads best with a pitched camera (`view.pitch`).
 *
 * The height can read a dataset of its own, so colour and height compare two
 * indicators on the same features — darker and taller where both are high,
 * darker but low where only the colour's is. Point `mapDataId` at a `mapData`
 * entry on the layer's source, with a `stateKey` apart from the colour's (both
 * land in the same features' state), and give it `thresholds` for `'class'`
 * mode: the colour legend's breaks belong to the other indicator.
 */
export interface PolygonExtrusion {
  /** Height mapping. Default: `'class'`. */
  mode?: 'class' | 'continuous';
  /**
   * The `mapData` entry the height reads. Omit it to read the colour's — the
   * same indicator in both. Must sit on the layer's source.
   */
  mapDataId?: string;
  /**
   * `'class'` mode breaks for the height, ascending. Default: the active
   * legend's when the height reads the colour's dataset; none otherwise — a
   * dataset of its own without them is read `'continuous'`.
   */
  thresholds?: number[];
  /** Height, in metres, of the top class or the largest value. Default: `3000`. */
  maxHeight?: number;
  /**
   * `'class'` mode only: explicit height of each class, lowest class first —
   * one more entry than the legend has thresholds. Overrides `maxHeight`; a
   * shorter list repeats its last height for the remaining classes.
   */
  heights?: number[];
  /**
   * Duration, in milliseconds, of the prisms' rise and fall: when the layer
   * gains or loses `extrusion`, and whenever its heights change (a new
   * `maxHeight`, new data). `0` snaps. Default: `600`. A viewer's
   * reduced-motion setting snaps too.
   */
  transitionMs?: number;
}

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
    /**
     * Feature property key holding the latitude. Paired with `lngKey`, geovis
     * reads the pin position from `feature.properties` instead of the tile
     * geometry to avoid drift at high zoom.
     */
    latKey?: string;
    /** Feature property key holding the longitude. Must be paired with `latKey`. */
    lngKey?: string;
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
   * Spec-driven click reaction. When present, `<GeoVisProvider>` invokes
   * `click.onSelect` for features clicked on this layer — without the consumer
   * placing a component or calling `useGeoVisClick()` in the tree. Declaring
   * `click` also opts the layer into click tracking, so `activeLegendId` is not
   * required. Typed via a type-only import so the data-only spec layer keeps no
   * runtime dependency on React (mirrors `hoverTooltip`).
   */
  click?: LayerClickConfig;
  /**
   * Proportional symbol configuration. When present on a point layer,
   * `circle-radius` is driven by a data expression instead of a static value.
   * Ignored on non-point geometries.
   */
  sizeBy?: SizeBy;
  /**
   * Renders a polygon layer in 3D, its features extruded by value — see
   * {@link PolygonExtrusion}. Ignored on non-polygon geometries.
   *
   * @example
   * ```ts
   * const layer: VisualizationLayer = {
   *   id: 'districts',
   *   sourceId: 'districts-src',
   *   geometry: 'polygon',
   *   mapDataId: 'rates',
   *   activeLegendId: 'rates-legend',
   *   extrusion: { maxHeight: 4000 },
   * };
   * ```
   */
  extrusion?: PolygonExtrusion;
  /**
   * GeoJSON feature property name for direct data access without `mapData`.
   *
   * When set (and `mapDataId` is absent), the proportional circles expression
   * reads values directly from `feature.properties[propertyName]` via MapLibre's
   * `['get', propertyName]` syntax — no feature-state join needed.
   *
   * When `mapDataId` is also set, this field is ignored in favour of the
   * standard feature-state resolution.
   */
  propertyName?: string;
  /**
   * Declarative predicate that hides features not matching it, compiled to
   * the engine's native filter expression (`dispatch({ type: 'set-filter' })`,
   * PRD-002). Reads `feature.properties[property]` — the same direct-access
   * path `propertyName` uses above, not the `mapData`-joined feature-state
   * value. Gated by `CapabilitySet.dataFeatures.filter` per source type.
   */
  filter?: LayerFilter;
  /**
   * Opt-in animated transition applied when this layer's source `data` changes
   * between two specs. Only honoured for `point` (circle) layers backed by a
   * `geojson` source; ignored otherwise. When declared, the adapter fades the
   * OLD points out while the NEW points fade in, instead of swapping data
   * instantly. Omit it to keep the instant `setData` behaviour.
   *
   * @example
   * ```ts
   * const layer: VisualizationLayer = {
   *   id: 'stores',
   *   sourceId: 'stores-src',
   *   geometry: 'point',
   *   transition: { kind: 'crossfade', durationMs: 600, easing: 'ease-in-out' },
   * };
   * ```
   */
  transition?: LayerTransition;
}

/**
 * Declarative, engine-agnostic animated transition for a `VisualizationLayer`.
 * `'crossfade'` is the only kind in v1 and applies exclusively to point
 * (circle) layers whose `geojson` source `data` reference changes.
 *
 * @example
 * ```ts
 * const transition: LayerTransition = { kind: 'crossfade', durationMs: 400 };
 * ```
 */
export interface LayerTransition {
  /** Discriminator. `'crossfade'` fades old points out while new points fade in. */
  kind: 'crossfade';
  /** Total fade duration in milliseconds. @default 400 */
  durationMs?: number;
  /** Easing curve applied to the fade progress. @default 'ease-out' */
  easing?: 'linear' | 'ease-out' | 'ease-in-out';
}

/** Comparison used by a `LayerFilter` — a closed set mapped to native engine filter expressions. */
export type LayerFilterOperator =
  'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not-in';

/**
 * Declarative, engine-agnostic filter predicate on one `VisualizationLayer`.
 * `in`/`not-in` expect `value` to be an array; the other operators expect a
 * single scalar.
 */
export interface LayerFilter {
  /** GeoJSON feature property to filter on. */
  property: string;
  operator: LayerFilterOperator;
  value: string | number | Array<string | number>;
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
  /**
   * Controls the visibility of the basemap's text/icon labels (its `symbol`
   * layers). When `false`, every `symbol` layer is hidden, leaving a clean
   * geography with no place names, road names, or POI markers.
   *
   * @remarks
   * Like the historical `HideBasemapLabels` pattern, hiding affects **all**
   * `symbol` layers — including any `symbol` layers you declare in
   * `spec.layers`. Toggling back to `true` restores the basemap's own label
   * layers without overriding the visibility you manage on your own layers.
   *
   * Defaults to `true`.
   */
  labels?: boolean;
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

/**
 * Current `VisualizationSpec` schema version (ADR-0001 consequence).
 * A spec that omits `schemaVersion` is treated as this version — versioning
 * is additive, existing unversioned specs are not penalized. A spec that
 * declares a different version is rejected with a repairable `invalid`
 * issue rather than validated (or silently misinterpreted) against the
 * wrong shape.
 */
export const SPEC_SCHEMA_VERSION = 1;

export interface VisualizationSpec {
  /** Schema version this spec was authored against. Omit for the current version — see `SPEC_SCHEMA_VERSION`. */
  schemaVersion?: number;
  title?: string;
  description?: string;
  engine: 'maplibre';
  mapType?: MapType;
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
  /**
   * Images registered on the map, for `symbol` layers to reference by id
   * (`paint.iconImage`). They are built and loaded asynchronously; a layer
   * drawing one shows it as soon as it is ready, and again after a basemap
   * change.
   */
  images?: ImageSpec[];
  metadata?: Record<string, unknown>;
  /**
   * @deprecated No longer used by the adapter. Kept for backward compatibility
   * so existing specs continue to pass `validateSpec()`. Will be removed in a
   * future breaking-change release.
   */
  adapterHints?: unknown;

  /**
   * Visual scale ceiling for proportional symbol rendering.
   *
   * Values above `scaleMaxValue` render at the maximum symbol size
   * (e.g. max circle radius). The tooltip always shows the real feature value.
   *
   * When omitted, the adapter computes it from the dataset.
   */
  scaleMaxValue?: number;

  /**
   * Controls whether auto-generated legends are produced for the resolved
   * mapType. Defaults to true. Has no effect on legends the user supplies
   * directly via `spec.legends`.
   */
  legendEnabled?: boolean;

  /**
   * Controls whether MapLibre's attribution control — the round button in the
   * map's bottom-right corner that expands into the basemap credits — is
   * mounted. Defaults to `true`.
   *
   * Set it to `false` only when the application renders the same credits
   * somewhere else: basemap and source licences (OpenStreetMap's among them)
   * generally require attribution to stay visible, and hiding the control does
   * not lift that obligation. Each source's own `attribution` string is
   * unaffected — it simply has no built-in surface left to appear on.
   */
  attributionControlEnabled?: boolean;

  /**
   * Internal marker set by `resolveSpecFromMapType` to prevent double-resolution.
   * Consumers should not set this field directly.
   */
  __resolved?: boolean;

  /**
   * Named, curated camera positions the AI (or a UI control) can jump to by
   * id (`dispatch({ type: 'set-view-preset' })`, PRD-002) — bounded to
   * positions the application actually declared, instead of raw coordinates
   * an AI would otherwise have to invent.
   */
  viewPresets?: ViewPreset[];

  /**
   * A single floating panel of layer-visibility toggles, overlaid on the map.
   * When present, `<GeoVisProvider>` auto-mounts a `<GeoVisLayerControl>` for
   * it — the consumer does not place the component. Each item toggles a set of
   * layers by id via `dispatch({ type: 'toggle-layer' })`.
   */
  control?: LayerControl;
}

export type GeovisSpec = VisualizationSpec;

/**
 * How the camera travels to a {@link ViewPreset}.
 *
 * Declared on the preset rather than on the action, because the flight belongs
 * to the destination: the app that curated a country-wide overview and a city
 * knows that the trip between them is long enough to be worth watching, and
 * whatever asks for the move — a sidebar, an agent — should not have to.
 */
export interface ViewAnimation {
  /**
   * Whether the camera flies rather than lands. Defaults to `true`; `false` is
   * an instant cut, which is what a move the user is not meant to follow wants.
   */
  animate?: boolean;
  /**
   * Milliseconds the flight takes. Omitted, the engine derives one from the
   * distance, which makes a short hop and a continental flight read alike.
   */
  duration?: number;
  /**
   * How far the camera pulls back on the way. Higher arcs higher, which is what
   * shows the route rather than just the ends of it. MapLibre defaults to 1.42.
   */
  curve?: number;
  /** Ground speed of the flight, ignored when `duration` is given. */
  speed?: number;
  /**
   * Fly even for a viewer who asked their system to reduce motion. Off by
   * default, so that request is honoured and the camera cuts instead.
   *
   * Turn it on only where the flight carries the meaning — where the point is
   * *where* the map went, not that it went somewhere — since it overrides an
   * accessibility preference the viewer set deliberately.
   */
  essential?: boolean;
}

/** A named camera position `set-view-preset` can target by `id`. */
export interface ViewPreset {
  id: string;
  /** Human-readable label, e.g. for a UI picker. */
  label?: string;
  view: ViewState;
  /** How the camera travels here. Omitted, the engine's own flight applies. */
  animation?: ViewAnimation;
}

/**
 * A floating panel that expands to reveal one toggle button per
 * {@link LayerControlItem}. Rendered by `<GeoVisLayerControl>`, which
 * `<GeoVisProvider>` auto-mounts when `spec.control` is set.
 */
export interface LayerControl {
  /** Unique identifier for the panel. */
  id: string;
  /**
   * Corner the panel is anchored to (absolute overlay), reusing the legend
   * position vocabulary. Defaults to `'bottom-left'`.
   */
  position?: LegendPosition;
  /**
   * Distance in pixels from the anchored map edges. Defaults to `40`. A single
   * number applies to both edges; pass `{ x, y }` to offset each axis
   * independently (each falling back to `40` when omitted) — e.g. push the
   * control clear of a side panel horizontally without lifting it off the
   * bottom edge. Increase it to clear map chrome (e.g. MapLibre's attribution)
   * or app UI.
   */
  offset?: number | { x?: number; y?: number };
  /** Text shown on the collapsed trigger button. Defaults to `'Layers'`. */
  label?: string;
  /**
   * Icon shown on the collapsed trigger button, as a `@ttoss/react-icons` name
   * (e.g. `'lucide:layers'`). When omitted a built-in stacked-sheets glyph is
   * used, so the trigger looks identical without configuration.
   */
  icon?: string;
  /**
   * How the panel expands to reveal its items. `'hover'` (default) expands on
   * pointer/focus enter; `'click'` toggles on trigger click. Both triggers
   * still respond to a click so touch devices can open a hover panel.
   */
  trigger?: 'hover' | 'click';
  /**
   * How many items the expanded panel shows before collapsing the rest behind
   * a "Ver mais" card. Clicking that card opens a larger panel listing every
   * item, which stays open until dismissed (close button, `Escape` or a click
   * outside) even for the `'hover'` trigger. The first `maxVisibleItems` of
   * `items`, in order, are the ones shown. When omitted — or when `items` has
   * no more than this many entries — every item is shown and no card appears.
   */
  maxVisibleItems?: number;
  /**
   * What the expanded panel shows: toggle buttons ({@link LayerControlItem}),
   * and optionally categories ({@link LayerControlGroup}) holding more of
   * them, in any mix and in the order given. A control without groups behaves
   * exactly as a flat list of toggles.
   */
  items: LayerControlEntry[];
}

/**
 * A category inside a {@link LayerControl}: a card that, when clicked, opens a
 * panel with its own toggle buttons rather than toggling anything itself.
 * Groups hold items only — they do not nest.
 *
 * The card shows how many of its items are on, and renders disabled when every
 * one of them is (none of their layers exist in the current spec).
 *
 * @example
 * ```ts
 * {
 *   id: 'saude',
 *   label: 'Saúde',
 *   items: [
 *     { id: 'ubs', label: 'UBS', layers: ['ubs-pins'] },
 *     { id: 'hospitais', label: 'Hospitais', layers: ['hospitais-pins'] },
 *   ],
 * }
 * ```
 */
export interface LayerControlGroup {
  /** Stable identity for the category. Must not repeat any item's id. */
  id: string;
  /** Text shown on the category's card and as its panel's title. */
  label: string;
  /**
   * Image shown on the category's card, as for an item. When omitted, the
   * built-in stylised map preview is used.
   */
  thumbnail?: string;
  /** The toggle buttons the category's panel lists. */
  items: LayerControlItem[];
}

/** One entry of {@link LayerControl.items}: a toggle, or a category of them. */
export type LayerControlEntry = LayerControlItem | LayerControlGroup;

/**
 * One toggle button inside a {@link LayerControl}. Clicking it flips the
 * visibility of every referenced layer that exists in the current spec.
 *
 * @remarks
 * `layers` are matched leniently: ids that do not exist in the active spec are
 * ignored, and when **none** of them exist the button renders disabled
 * (greyed, non-interactive) instead of rejecting the spec. This lets a single
 * `control` be reused across spec variations where a given layer is only
 * present in some of them.
 */
export interface LayerControlItem {
  /**
   * Stable identity for the item. Its toggled on/off state is remembered by
   * this id, so it persists across spec rebuilds (e.g. switching map modes)
   * even when the underlying layer ids differ between them.
   */
  id: string;
  /** Text shown on the toggle button. */
  label: string;
  /**
   * Image shown on the item's card in the expanded panel — a URL or data URI
   * rendered to fill the thumbnail square (cropped to cover). When omitted, a
   * built-in stylised map preview is used, so every item looks identical.
   */
  thumbnail?: string;
  /** Ids of `spec.layers` toggled together when the button is clicked. */
  layers: string[];
  /**
   * Whether the referenced layers start visible the first time this item is
   * seen (before the user has toggled it). Defaults to `true`.
   */
  defaultActive?: boolean;
}
