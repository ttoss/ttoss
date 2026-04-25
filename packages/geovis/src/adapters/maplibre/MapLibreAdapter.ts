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
  removeMapDataFromSource,
} from './mapDataFeatureState';
import { toMaplibreSource } from './sourceTranslation';
import { syncSourcesAndLayers } from './syncSourcesAndLayers';

// Re-exports preserved for public API and historical test imports.
export { toMaplibreLayer, toMaplibreSource };

const DEFAULT_STYLE = 'https://demotiles.maplibre.org/style.json';

/** Returns the base map style URL, falling back to the MapLibre demo tiles when `basemap.styleUrl` is absent. */
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

/** Translates a GeoVis camelCase paint key to the MapLibre kebab-case property name for the given geometry type. */
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

/** Strips `undefined` paint values before `map.addLayer` to satisfy MapLibre's strict paint validation. */
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

/** Applies a paint property immediately if the style is loaded, otherwise defers to `style.load`. */
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

/** Adds a layer to the map if not already present; resolves sourceLayer from the source when absent on the layer. */
const applyLayerAdd = (
  map: maplibregl.Map,
  viewState: LayerHostState,
  newLayer: VisualizationLayer
): void => {
  if (map.getLayer(newLayer.id)) return;
  const source = viewState.spec.sources.find((s) => {
    return s.id === newLayer.sourceId;
  });
  const effectiveSourceLayer =
    newLayer.sourceLayer ??
    (source && 'sourceLayer' in source
      ? (source as { sourceLayer?: string }).sourceLayer
      : undefined);
  map.addLayer(
    stripUndefinedPaint(toMaplibreLayer(newLayer, effectiveSourceLayer))
  );
  viewState.spec = {
    ...viewState.spec,
    layers: [...viewState.spec.layers, newLayer],
  };
};

/** Removes a layer from the map if present and updates `viewState.spec`. */
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

/** Applies a paint-property replacement to a live layer; resolves spec key to MapLibre property via `specPaintKeyToMaplibre`. */
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

/** Dispatches a layer-targeted patch to `applyLayerAdd`, `applyLayerRemove`, or `applyLayerPaintReplace`. */
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

/** Dispatches a source-targeted patch; on `remove`, also removes layers that reference the source. */
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

/** Syncs map camera (center, zoom, pitch, bearing) to `next`, skipping values unchanged from `prev`. */
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

/** Instantiates a MapLibre map from the spec's view and basemap fields. */
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

/** Creates a MapLibre map in the container, registers it in the view registry, and returns a `MountedView` handle. */
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
 * Updates a mounted view to reflect a new spec. When the style URL changes,
 * calls `map.setStyle()` and defers source/layer re-application to `style.load`.
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
    if (previousSpec.mapData !== spec.mapData) {
      for (const prevMd of previousSpec.mapData ?? []) {
        const nextMd = (spec.mapData ?? []).find((md) => {
          return md.mapDataId === prevMd.mapDataId;
        });
        if (!nextMd || nextMd !== prevMd) {
          removeMapDataFromSource(map, prevMd);
        }
      }
      reapplyAllMapData(map, spec);
    }
  } else {
    map.once('style.load', onStyleReady);
  }
};

/** Routes a `SpecPatch` to the layer, source, or mapData handler for a single view. */
const dispatchPatch = (viewState: ViewState, patch: SpecPatch): void => {
  const { map } = viewState;
  if (patch.target === 'layer') {
    applyLayerPatch(map, viewState, patch as SpecPatch & { target: 'layer' });
  } else if (patch.target === 'source') {
    applySourcePatch(map, viewState, patch as SpecPatch & { target: 'source' });
  } else if (patch.target === 'mapData') {
    applyMapDataPatchToMap(map, viewState.spec.mapData ?? [], patch);
    viewState.spec = applyMapDataPatchToSpec(viewState.spec, patch);
  }
};

/** Removes all map instances and clears the view registry. */
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
