import 'maplibre-gl/dist/maplibre-gl.css';

import maplibregl from 'maplibre-gl';

import type {
  CapabilitySet,
  EngineAdapter,
  MountedView,
  SpecPatch,
} from '../../runtime/adapter';
import { applyMapDataPatchToSpec } from '../../spec/mapDataPatch';
import type {
  DataSource,
  GeoVisGeometryType,
  VisualizationLayer,
  VisualizationSpec,
} from '../../spec/types';
import { toMaplibreLayer } from './layerTranslation';
import {
  applyMapDataPatchToMap,
  reapplyAllMapData,
} from './mapDataFeatureState';
import { toMaplibreSource } from './sourceTranslation';
import { syncSourcesAndLayers } from './syncSourcesAndLayers';

// Re-exports preserved for public API and historical test imports.
export { toMaplibreLayer, toMaplibreSource };

const DEFAULT_STYLE = 'https://demotiles.maplibre.org/style.json';

/**
 * Resolves the base map style URL from the spec, falling back to the MapLibre
 * demo tiles when `spec.basemap.styleUrl` is absent.
 *
 * @remarks
 * The fallback exists so a `VisualizationSpec` without any basemap config
 * still renders a visible map. Production consumers should always set
 * `basemap.styleUrl` to avoid depending on the external demo endpoint.
 */
const resolveStyleUrl = (spec: VisualizationSpec): string => {
  return spec.basemap?.styleUrl ?? DEFAULT_STYLE;
};

// Maps spec-level camelCase paint keys to MapLibre kebab-case paint properties.
// `lineColor` is geometry-dependent: polygon uses `fill-outline-color`,
// line uses `line-color`.
const SPEC_PAINT_KEY_MAP: Record<
  string,
  string | ((g: GeoVisGeometryType) => string | undefined)
> = {
  fillColor: 'fill-color',
  fillOpacity: 'fill-opacity',
  lineColor: (g) => {
    return g === 'polygon' ? 'fill-outline-color' : 'line-color';
  },
  lineWidth: (g) => {
    return g === 'polygon' ? undefined : 'line-width';
  },
  lineOpacity: 'line-opacity',
  lineDasharray: 'line-dasharray',
  circleColor: 'circle-color',
  circleRadius: 'circle-radius',
  circleOpacity: 'circle-opacity',
  circleStrokeColor: 'circle-stroke-color',
  circleStrokeWidth: 'circle-stroke-width',
  rasterOpacity: 'raster-opacity',
  heatmapRadius: 'heatmap-radius',
  heatmapOpacity: 'heatmap-opacity',
  heatmapIntensity: 'heatmap-intensity',
  heatmapWeight: 'heatmap-weight',
  textColor: 'text-color',
  textOpacity: 'text-opacity',
  textHaloColor: 'text-halo-color',
  textHaloWidth: 'text-halo-width',
  iconColor: 'icon-color',
  iconOpacity: 'icon-opacity',
};

/**
 * Translates a GeoVis spec-level camelCase paint key into the MapLibre
 * kebab-case paint property name for the given geometry type.
 *
 * @remarks
 * Some keys are geometry-dependent: `lineColor` maps to `fill-outline-color`
 * on polygons but to `line-color` on lines. `lineWidth` has no polygon
 * equivalent and returns `undefined`, which callers must treat as "skip".
 *
 * Returns `undefined` for unrecognised keys so callers can silently ignore
 * unknown paint properties instead of forwarding them to MapLibre.
 */
const specPaintKeyToMaplibre = (
  key: string,
  geometry: GeoVisGeometryType
): string | undefined => {
  const entry = SPEC_PAINT_KEY_MAP[key];
  if (!entry) return undefined;
  return typeof entry === 'function' ? entry(geometry) : entry;
};

interface LayerHostState {
  spec: VisualizationSpec;
}

/**
 * Removes paint properties with value `undefined` from a MapLibre layer
 * before registering it with the map.
 *
 * @remarks
 * MapLibre throws at `map.addLayer()` when paint values are `undefined`.
 * The GeoVis spec model intentionally allows optional paint keys to be absent,
 * so this strip step is applied at the translation boundary before every layer
 * registration.
 */
const stripUndefinedPaint = (
  layer: maplibregl.LayerSpecification
): maplibregl.LayerSpecification => {
  const paint = (layer as { paint?: Record<string, unknown> }).paint;
  if (paint) {
    (layer as { paint?: Record<string, unknown> }).paint = Object.fromEntries(
      Object.entries(paint).filter(([, v]) => {
        return v !== undefined;
      })
    );
  }
  return layer;
};

/**
 * Applies a paint property update to a live MapLibre layer, deferring the
 * call until the map style is fully loaded if needed.
 *
 * @remarks
 * `setPaintProperty` silently fails when called before the style has loaded.
 * Deferring via `once('style.load', …)` guarantees the property is applied
 * even if the patch fires immediately after a `setStyle` call.
 */
const setPaintWhenReady = (
  map: maplibregl.Map,
  layerId: string,
  property: string,
  value: unknown
): void => {
  const apply = () => {
    map.setPaintProperty(
      layerId,
      property,
      value as maplibregl.StyleSpecification
    );
  };
  if (map.isStyleLoaded()) apply();
  else map.once('style.load', apply);
};

/**
 * Adds a new layer to the map for a given spec layer, guarded by an existence
 * check to make the operation idempotent.
 *
 * @remarks
 * `stripUndefinedPaint` is applied before `map.addLayer` because MapLibre
 * rejects `undefined` paint values at registration time.
 * `viewState.spec` is updated in place so the adapter's local copy stays
 * consistent with the map's state for subsequent patch operations.
 */
const applyLayerAdd = (
  map: maplibregl.Map,
  viewState: LayerHostState,
  newLayer: VisualizationLayer
): void => {
  if (map.getLayer(newLayer.id)) return;
  map.addLayer(
    stripUndefinedPaint(toMaplibreLayer(newLayer, newLayer.sourceLayer))
  );
  viewState.spec = {
    ...viewState.spec,
    layers: [...viewState.spec.layers, newLayer],
  };
};

/**
 * Removes a layer from the map, guarded by an existence check to make the
 * operation idempotent.
 *
 * @remarks
 * `viewState.spec` is updated in place after removal so the adapter's local
 * copy stays consistent for subsequent patches.
 */
const applyLayerRemove = (
  map: maplibregl.Map,
  viewState: LayerHostState,
  layerId: string
): void => {
  if (!map.getLayer(layerId)) return;
  map.removeLayer(layerId);
  viewState.spec = {
    ...viewState.spec,
    layers: viewState.spec.layers.filter((l) => {
      return l.id !== layerId;
    }),
  };
};

/**
 * Applies a single paint-property replacement to a live MapLibre layer.
 *
 * @remarks
 * Resolves the spec key to the MapLibre paint property via
 * `specPaintKeyToMaplibre`, which is geometry-type–aware. Silently returns
 * without side effects when the path shape is unrecognised or the key has no
 * MapLibre equivalent for the layer's geometry type.
 *
 * Delegates to `setPaintWhenReady` to handle patches that arrive before the
 * style has finished loading (e.g. immediately after a `setStyle` call).
 */
const applyLayerPaintReplace = (
  map: maplibregl.Map,
  viewState: LayerHostState,
  path: string,
  value: unknown
): void => {
  const parts = path.split('.');
  if (parts.length < 4 || parts[2] !== 'paint') return;
  const layerId = parts[1];
  const specKey = parts[3];
  const layer = viewState.spec.layers.find((l) => {
    return l.id === layerId;
  });
  if (!layer) return;
  const maplibreKey = specPaintKeyToMaplibre(specKey, layer.geometry);
  if (!maplibreKey) return;
  setPaintWhenReady(map, layerId, maplibreKey, value);
};

/**
 * Top-level dispatcher for layer-targeted patches on a single map view.
 *
 * @remarks
 * Delegates to the specific handler (`applyLayerAdd`, `applyLayerRemove`,
 * `applyLayerPaintReplace`) based on the patch op. Unrecognised shapes are
 * silently ignored to keep the adapter resilient against unknown future
 * patch types.
 */
const applyLayerPatch = (
  map: maplibregl.Map,
  viewState: LayerHostState,
  patch: SpecPatch & { target: 'layer' }
): void => {
  if (patch.op === 'add' && patch.value != null) {
    applyLayerAdd(map, viewState, patch.value as VisualizationLayer);
    return;
  }
  if (patch.op === 'remove') {
    applyLayerRemove(map, viewState, patch.value as string);
    return;
  }
  if (patch.op === 'replace' && patch.value !== undefined) {
    applyLayerPaintReplace(map, viewState, patch.path, patch.value);
  }
};

/**
 * Top-level dispatcher for source-targeted patches on a single map view.
 *
 * @remarks
 * On `remove`, layers referencing the removed source are also removed from
 * the map and from `viewState.spec.layers` to preserve the invariant that
 * every active layer must have a corresponding source.
 *
 * Existence checks (`map.getSource`, `map.getLayer`) make all operations
 * idempotent, so calling this function more than once with the same patch
 * is safe.
 */
const applySourcePatch = (
  map: maplibregl.Map,
  viewState: LayerHostState,
  patch: SpecPatch & { target: 'source' }
): void => {
  if (patch.op === 'add' && patch.value != null) {
    const newSource = patch.value as DataSource;
    if (map.getSource(newSource.id)) return;
    map.addSource(newSource.id, toMaplibreSource(newSource));
    viewState.spec = {
      ...viewState.spec,
      sources: [...viewState.spec.sources, newSource],
    };
    return;
  }
  if (patch.op !== 'remove') return;
  const sourceId = patch.value as string;
  if (!map.getSource(sourceId)) return;
  for (const layer of viewState.spec.layers) {
    if (layer.sourceId === sourceId && map.getLayer(layer.id)) {
      map.removeLayer(layer.id);
    }
  }
  map.removeSource(sourceId);
  viewState.spec = {
    ...viewState.spec,
    layers: viewState.spec.layers.filter((l) => {
      return l.sourceId !== sourceId;
    }),
    sources: viewState.spec.sources.filter((s) => {
      return s.id !== sourceId;
    }),
  };
};

const syncCenter = (
  map: maplibregl.Map,
  prev: VisualizationSpec['view'],
  next: VisualizationSpec['view']
): void => {
  if (prev.center[0] === next.center[0] && prev.center[1] === next.center[1]) {
    return;
  }
  map.setCenter(next.center as maplibregl.LngLatLike);
};

/**
 * Synchronises the map's camera properties (center, zoom, pitch, bearing)
 * with the next spec view, skipping unchanged values.
 *
 * @remarks
 * Each property is gated by an equality check because MapLibre animates
 * camera transitions — redundant calls with the same value would produce
 * unwanted visual motion on every spec update.
 */
const syncMapView = (
  map: maplibregl.Map,
  prev: VisualizationSpec['view'],
  next: VisualizationSpec['view']
): void => {
  syncCenter(map, prev, next);
  if (prev.zoom !== next.zoom) map.setZoom(next.zoom);
  const prevPitch = prev.pitch ?? 0;
  const nextPitch = next.pitch ?? 0;
  if (prevPitch !== nextPitch) map.setPitch(nextPitch);
  const prevBearing = prev.bearing ?? 0;
  const nextBearing = next.bearing ?? 0;
  if (prevBearing !== nextBearing) map.setBearing(nextBearing);
};

interface ViewState {
  map: maplibregl.Map;
  spec: VisualizationSpec;
  styleUrl: string;
}

type ViewMap = Map<string, ViewState>;

/**
 * Instantiates a MapLibre `Map` inside the given container, configured from
 * the spec's `view` and `basemap` fields.
 *
 * @remarks
 * The style URL is resolved once at construction time; subsequent basemap
 * changes are handled by `updateView` via `map.setStyle()`.
 *
 * Returns both `map` and `styleUrl` so the caller can store the initial URL
 * and detect changes on future spec updates to trigger a `setStyle` call.
 */
const createMap = (
  spec: VisualizationSpec,
  container: HTMLElement
): { map: maplibregl.Map; styleUrl: string } => {
  const { view } = spec;
  const styleUrl = resolveStyleUrl(spec);
  const map = new maplibregl.Map({
    container,
    style: styleUrl,
    center: view.center,
    zoom: view.zoom,
    pitch: view.pitch ?? 0,
    bearing: view.bearing ?? 0,
  });
  map.addControl(
    new maplibregl.NavigationControl({
      visualizePitch: true,
      visualizeRoll: true,
      showZoom: true,
      showCompass: true,
    })
  );
  return { map, styleUrl };
};

/**
 * Mounts a new MapLibre map in `container`, registers initial sources and
 * layers once the `load` event fires, and returns a `MountedView` handle.
 *
 * @remarks
 * Sources and layers are applied inside `map.on('load', …)` because MapLibre
 * requires the style to be ready before `addSource` / `addLayer` calls.
 *
 * `destroy()` on the returned handle is guarded with a `_removed` flag to
 * prevent double-removal errors if called more than once.
 *
 * @param views - The per-adapter registry of active views; the new state is
 *   stored here under `viewId`.
 * @param viewId - A caller-assigned identifier unique within this adapter
 *   instance. Reusing a `viewId` would silently overwrite the previous view.
 */
const mountView = (
  views: ViewMap,
  container: HTMLElement,
  spec: VisualizationSpec,
  viewId: string
): MountedView => {
  const { map, styleUrl } = createMap(spec, container);
  views.set(viewId, { map, spec, styleUrl });
  map.on('load', () => {
    const viewState = views.get(viewId);
    if (!viewState) return;
    syncSourcesAndLayers(map, viewState.spec, null);
    reapplyAllMapData(map, viewState.spec);
  });
  let _removed = false;
  return {
    viewId,
    container,
    destroy: () => {
      if (_removed) return;
      _removed = true;
      try {
        map.remove();
      } catch {
        // MapLibre can throw if the map was not fully initialized.
      }
      views.delete(viewId);
    },
  };
};

/**
 * Updates an existing MapLibre view to reflect a new `VisualizationSpec`.
 *
 * @remarks
 * When the basemap style URL changes, `map.setStyle()` destroys all sources
 * and layers. The `style.load` listener re-applies them from
 * `views.get(viewId)` (not the `spec` closure) to capture any intermediate
 * patches that arrive between `setStyle` and the load event.
 *
 * When the style is unchanged, `syncSourcesAndLayers` is called immediately
 * if the style is already loaded; otherwise it is deferred to `style.load`.
 */
const updateView = (
  views: ViewMap,
  viewId: string,
  viewState: ViewState,
  spec: VisualizationSpec
): void => {
  const { map } = viewState;
  const nextStyleUrl = resolveStyleUrl(spec);
  const previousSpec = viewState.spec;
  viewState.spec = spec;
  syncMapView(map, previousSpec.view, spec.view);

  const onStyleReady = () => {
    const updated = views.get(viewId);
    if (!updated) return;
    syncSourcesAndLayers(map, updated.spec, null);
    reapplyAllMapData(map, updated.spec);
  };

  if (nextStyleUrl !== viewState.styleUrl) {
    viewState.styleUrl = nextStyleUrl;
    map.once('style.load', onStyleReady);
    map.setStyle(nextStyleUrl);
    return;
  }
  if (map.isStyleLoaded()) {
    syncSourcesAndLayers(map, spec, previousSpec);
    reapplyAllMapData(map, spec);
  } else {
    map.once('style.load', onStyleReady);
  }
};

/**
 * Routes a `SpecPatch` to the correct handler for a single map view.
 *
 * @remarks
 * This is the innermost dispatch point in the adapter. Each target type
 * (`layer`, `source`, `mapData`) has a dedicated handler. For `mapData`
 * patches, `viewState.spec` is updated here (via `applyMapDataPatchToSpec`)
 * to keep the adapter's local copy in sync with the runtime's `currentSpec`.
 */
const dispatchPatch = (viewState: ViewState, patch: SpecPatch): void => {
  const { map } = viewState;
  if (patch.target === 'layer') {
    applyLayerPatch(map, viewState, patch);
  } else if (patch.target === 'source') {
    applySourcePatch(map, viewState, patch);
  } else if (patch.target === 'mapData') {
    applyMapDataPatchToMap(map, viewState.spec.mapData ?? [], patch);
    viewState.spec = applyMapDataPatchToSpec(viewState.spec, patch);
  }
};

/**
 * Removes all active MapLibre map instances and clears the view registry.
 *
 * @remarks
 * Each removal is wrapped in try/catch because MapLibre can throw if a map
 * was never fully initialised (e.g. the container was removed from the DOM
 * before the `load` event fired).
 */
const destroyAll = (views: ViewMap): void => {
  for (const viewState of views.values()) {
    try {
      viewState.map.remove();
    } catch {
      // ignore partially-initialized maps
    }
  }
  views.clear();
};

const CAPABILITIES: CapabilitySet = {
  supports3D: false,
  supportsRaster: true,
  supportsVectorTiles: true,
  supportsCustomLayers: true,
};

/**
 * Creates a new, isolated MapLibre adapter instance.
 * Each call returns an independent instance with its own internal state,
 * allowing multiple maps to coexist without shared mutable state.
 */
const createMapLibreAdapter = (): EngineAdapter => {
  const _views: ViewMap = new Map();

  return {
    id: 'maplibre',
    getCapabilities: () => {
      return CAPABILITIES;
    },
    mount: (container, spec, viewId) => {
      return mountView(_views, container, spec, viewId);
    },
    update: (spec) => {
      for (const [viewId, viewState] of _views) {
        updateView(_views, viewId, viewState, spec);
      }
    },
    applyPatch: (patch) => {
      for (const viewState of _views.values()) {
        dispatchPatch(viewState, patch);
      }
    },
    destroy: () => {
      destroyAll(_views);
    },
    getNativeInstance: () => {
      return _views.size > 0
        ? (_views.values().next().value?.map ?? null)
        : null;
    },
  };
};

export default createMapLibreAdapter;
