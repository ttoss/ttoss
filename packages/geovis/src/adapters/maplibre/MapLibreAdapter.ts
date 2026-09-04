import 'maplibre-gl/dist/maplibre-gl.css';

import { log } from '@ttoss/logger';
import maplibregl from 'maplibre-gl';

import type { GeoVisSelection } from '../../runtime/action';
import type {
  CapabilitySet,
  EngineAdapter,
  MountedView,
  SetViewOptions,
  SpecPatch,
} from '../../runtime/adapter';
import {
  computeGeoJSONObjectsBbox,
  computeSourcesBbox,
  fetchUrlSourceData,
  hasUrlSources,
} from '../../spec/bounds';
import { applyMapDataPatchToSpec } from '../../spec/mapDataPatch';
import type {
  GeoJSONBoundingBox,
  MapData,
  VisualizationSpec,
} from '../../spec/types';
import { applyBasemapLabelsVisibility } from './basemapLabels';
import { attachFitToData } from './fitBoundsToData';
import { toMaplibreLayer } from './layerTranslation';
import { reapplyLegendDrivenFillPaint } from './legendFillPaint';
import {
  applyMapDataPatchToMap,
  mapDataEntriesEqual,
  reapplyAllMapData,
  removeMapDataFromSource,
} from './mapDataFeatureState';
import { silenceNonCancelableTouchMove } from './nonCancelableTouchMove';
import { applyLayerPatch, applySourcePatch } from './patchDispatch';
import { applySelectionToMap } from './selection';
import { toMaplibreSource } from './sourceTranslation';
import { syncSourcesAndLayers } from './syncSourcesAndLayers';
import { syncMapView } from './viewSync';

export { toMaplibreLayer, toMaplibreSource };

const DEFAULT_STYLE = 'https://tiles.openfreemap.org/styles/positron';

const BLANK_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {},
  layers: [],
};

// Blank style when basemap is hidden, else the spec's styleUrl or the default.
const resolveStyle = (
  spec: VisualizationSpec
): string | maplibregl.StyleSpecification => {
  if (spec.basemap?.visible === false) return BLANK_STYLE;
  return spec.basemap?.styleUrl ?? DEFAULT_STYLE;
};

type MapLibreStyle = string | maplibregl.StyleSpecification;

interface ViewState {
  map: maplibregl.Map;
  spec: VisualizationSpec;
  style: MapLibreStyle;
  fitBbox: GeoJSONBoundingBox | null;
  detachFit: (() => void) | null;
}

type ViewMap = Map<string, ViewState>;

// Either center or zoom set manually disables auto-fit-to-data.
const hasExplicitView = (view: VisualizationSpec['view']): boolean => {
  return view?.center !== undefined || view?.zoom !== undefined;
};

// Value equality, since bbox arrays are recomputed (never the same reference).
const bboxEqual = (
  a: GeoJSONBoundingBox | null,
  b: GeoJSONBoundingBox | null
): boolean => {
  if (a === b) return true;
  if (!a || !b || a.length !== b.length) return false;
  return a.every((value, index) => {
    return value === b[index];
  });
};

// Constructs the MapLibre instance with the spec's initial (static) camera.
const createMap = (
  spec: VisualizationSpec,
  container: HTMLElement
): { map: maplibregl.Map; style: MapLibreStyle } => {
  const view = spec.view ?? {};
  const style = resolveStyle(spec);
  const map = new maplibregl.Map({
    container,
    style,
    center: (view.center ?? [0, 0]) as maplibregl.LngLatLike,
    zoom: view.zoom ?? 1,
    maxZoom: view.maxZoomIn,
    minZoom: view.maxZoomOut,
    pitch: view.pitch ?? 0,
    bearing: view.bearing ?? 0,
    ...(spec.attributionControlEnabled === false
      ? { attributionControl: false as const }
      : {}),
  });
  map.addControl(
    new maplibregl.NavigationControl({
      visualizePitch: true,
      visualizeRoll: true,
      showZoom: true,
      showCompass: true,
    })
  );
  silenceNonCancelableTouchMove(map);
  return { map, style };
};

// True if any mapData entry was added, removed, or changed value.
const hasMapDataChanged = (
  previousMapData: MapData[] | undefined,
  nextMapData: MapData[] | undefined
): boolean => {
  if (previousMapData === nextMapData) return false;
  if (previousMapData?.length !== nextMapData?.length) return true;
  return (previousMapData ?? []).some((prevMd) => {
    const nextMd = (nextMapData ?? []).find((md) => {
      return md.mapDataId === prevMd.mapDataId;
    });
    return !nextMd || !mapDataEntriesEqual(nextMd, prevMd);
  });
};

// Clears feature-state for mapData entries removed or changed since the last spec.
const removeStaleMapData = (
  map: maplibregl.Map,
  previousMapData: MapData[] | undefined,
  nextMapData: MapData[] | undefined
): void => {
  for (const prevMd of previousMapData ?? []) {
    const nextMd = (nextMapData ?? []).find((md) => {
      return md.mapDataId === prevMd.mapDataId;
    });
    if (!nextMd || !mapDataEntriesEqual(nextMd, prevMd))
      removeMapDataFromSource(map, prevMd);
  }
};

// Routes a SpecPatch to its target-specific handler (layer/source/mapData).
const dispatchPatch = (viewState: ViewState, patch: SpecPatch): void => {
  const { map } = viewState;
  if (patch.target === 'layer') {
    applyLayerPatch(map, viewState, patch as SpecPatch & { target: 'layer' });
  } else if (patch.target === 'source') {
    applySourcePatch(map, viewState, patch as SpecPatch & { target: 'source' });
  } else if (patch.target === 'mapData') {
    applyMapDataPatchToMap(map, viewState.spec.mapData ?? [], patch);
    viewState.spec = applyMapDataPatchToSpec(viewState.spec, patch);
    reapplyLegendDrivenFillPaint(map, viewState.spec);
  } else {
    log.warn(
      `[geovis] MapLibreAdapter: unknown patch target "${
        (patch as { target: unknown }).target
      }" — patch was ignored.`
    );
  }
};

// Imperative camera call for the AI/runtime `setView` action — flyTo (animated) or jumpTo.
const applySetView = (map: maplibregl.Map, options: SetViewOptions): void => {
  const { center, zoom, pitch, bearing, animate = true } = options;
  const camera: maplibregl.CameraOptions = {};
  if (center !== undefined) camera.center = center as maplibregl.LngLatLike;
  if (zoom !== undefined) camera.zoom = zoom;
  if (pitch !== undefined) camera.pitch = pitch;
  if (bearing !== undefined) camera.bearing = bearing;
  if (Object.keys(camera).length === 0) return;
  if (animate) {
    map.flyTo(camera);
  } else {
    map.jumpTo(camera);
  }
};

// Tears down every mounted view (detaches auto-fit listeners, removes the map).
const destroyAll = (views: ViewMap): void => {
  for (const viewState of views.values()) {
    viewState.detachFit?.();
    try {
      viewState.map.remove();
    } catch {
      /* MapLibre can throw if the map was not fully initialized. */
    }
  }
  views.clear();
};

const CAPABILITIES: CapabilitySet = {
  sourceTypes: [
    'geojson',
    'vector-tiles',
    'raster-tiles',
    'raster-dem',
    'image',
    'video',
  ],
  layerGeometries: ['polygon', 'line', 'point', 'symbol', 'heatmap', 'raster'],
  dataFeatures: {
    featureState: ['geojson'],
    filter: ['geojson'],
  },
  viewFeatures: {
    pitch: true,
    bearing: true,
  },
};

type FetchCacheMap = Map<string, Promise<GeoJSONBoundingBox | null>>;

interface AdapterState {
  views: ViewMap;
  prevSelection: GeoVisSelection | null;
  urlFetchPromises: WeakMap<maplibregl.Map, FetchCacheMap>;
  currentUrlSpecKeyByMap: WeakMap<maplibregl.Map, string>;
}

// Fetches URL-based geojson sources once per specKey, then attaches the
// fit-to-data listener when the resolved bbox differs from the current one.
const attachUrlSourceFit = (
  state: AdapterState,
  viewState: ViewState,
  spec: VisualizationSpec,
  specKey: string
): void => {
  state.currentUrlSpecKeyByMap.set(viewState.map, specKey);
  let promiseCache = state.urlFetchPromises.get(viewState.map);
  if (!promiseCache) {
    promiseCache = new Map();
    state.urlFetchPromises.set(viewState.map, promiseCache);
  }
  if (!promiseCache.has(specKey)) {
    promiseCache.set(
      specKey,
      fetchUrlSourceData(spec.sources)
        .then(computeGeoJSONObjectsBbox)
        .catch(() => {
          return null;
        })
    );
  }
  promiseCache.get(specKey)!.then((fetchedBbox) => {
    if (!fetchedBbox) return;
    if (state.currentUrlSpecKeyByMap.get(viewState.map) !== specKey) return;
    if (hasExplicitView(viewState.spec.view)) return;
    if (bboxEqual(viewState.fitBbox, fetchedBbox)) return;
    viewState.detachFit?.();
    viewState.fitBbox = fetchedBbox;
    viewState.detachFit = attachFitToData(viewState.map, fetchedBbox);
  });
};

// The `syncFit` closure both mountView and updateView call: decides whether
// auto-fit applies (inline sources), needs an async URL fetch first, or is
// disabled (explicit view) — attaching/detaching `attachFitToData` accordingly.
const syncFitToData = (
  state: AdapterState,
  viewState: ViewState,
  spec: VisualizationSpec
): void => {
  const explicitView = hasExplicitView(spec.view);
  const nextBbox = explicitView ? null : computeSourcesBbox(spec.sources);

  if (nextBbox !== null && bboxEqual(viewState.fitBbox, nextBbox)) return;

  if (!explicitView && nextBbox === null && hasUrlSources(spec.sources)) {
    const specKey = JSON.stringify(
      spec.sources.filter((s) => {
        return s.type === 'geojson' && typeof s.data === 'string';
      })
    );
    attachUrlSourceFit(state, viewState, spec, specKey);
    return;
  }

  if (bboxEqual(viewState.fitBbox, nextBbox)) return;
  viewState.detachFit?.();
  viewState.fitBbox = nextBbox;
  viewState.detachFit = nextBbox
    ? attachFitToData(viewState.map, nextBbox)
    : null;
};

/**
 * Mounts a brand-new map instance. Centering happens in two stages here:
 * 1. `createMap` gives MapLibre a *synchronous* initial camera straight from
 *    `spec.view` (or `[0, 0]`/zoom `1` if `view` is omitted) — this is only
 *    ever a placeholder frame the user briefly sees before stage 2 corrects it.
 * 2. `syncFit` (→ `syncFitToData`) runs right after, before `load` even
 *    fires. When `view.center`/`view.zoom` are explicit it's a no-op — the
 *    stage-1 camera stands. When they're omitted, it attaches
 *    `attachFitToData`, which itself waits for the map's `idle` event to
 *    animate an actual `fitBounds` to the data — so the real "auto-fit"
 *    centering lands asynchronously, after this function has returned.
 */
const mountView = (
  state: AdapterState,
  container: HTMLElement,
  spec: VisualizationSpec,
  viewId: string,
  syncFit: (vs: ViewState, s: VisualizationSpec) => void
): MountedView => {
  // Stage 1: synchronous placeholder camera (explicit view, or [0,0]/zoom 1).
  const { map, style } = createMap(spec, container);
  const viewState: ViewState = {
    map,
    spec,
    style,
    fitBbox: null,
    detachFit: null,
  };
  state.views.set(viewId, viewState);
  // Stage 2: attaches the async auto-fit-to-data correction (see doc above);
  // only takes effect when spec.view.center/zoom are both omitted.
  syncFit(viewState, spec);
  map.on('load', () => {
    const vs = state.views.get(viewId);
    if (!vs) return;
    applyBasemapLabelsVisibility(map, vs.spec);
    syncSourcesAndLayers(map, vs.spec, null);
    reapplyAllMapData(map, vs.spec);
    applyBasemapLabelsVisibility(map, vs.spec);
  });
  let _removed = false;
  return {
    viewId,
    container,
    destroy: () => {
      if (_removed) return;
      _removed = true;
      viewState.detachFit?.();
      try {
        map.remove();
      } catch {
        /* MapLibre can throw if the map was not fully initialized. */
      }
      state.views.delete(viewId);
    },
  };
};

/**
 * Updates an already-mounted map — never recreates it, so centering here is
 * purely imperative camera calls on the live `map`, not constructor options.
 * Unlike `mountView`'s one-shot placeholder-then-correct sequence, `center`/
 * `zoom` control is exclusive per update, driven by whether they're explicit
 * (`hasExplicitView` only looks at `center`/`zoom` — `pitch`/`bearing`/
 * `maxZoomIn`/`maxZoomOut` are independent of it and always go through
 * `syncMapView` below, even while auto-fit is also active):
 * - `syncMapView`: applies explicit `view.center`/`zoom` *diffs* against the
 *   previous spec, via instant `setCenter`/`setZoom` (no animation), plus
 *   `pitch`/`bearing`/`maxZoomIn`/`maxZoomOut` diffs unconditionally. Its
 *   `center`/`zoom` sync no-ops when those fields are omitted from
 *   `spec.view` — but a `view` with only e.g. `pitch` set still runs the
 *   pitch/bearing/zoom-limit sync below, concurrently with auto-fit.
 * - `syncFit` (→ `syncFitToData`): re-evaluates the data bbox and, when
 *   `center`/`zoom` are still omitted and the bbox changed (e.g. a source's
 *   geometry was patched), detaches the old `attachFitToData` listener and
 *   attaches a new one — which re-fits with an animated `fitBounds`, same as
 *   on mount. Switching a spec's `center`/`zoom` from explicit to omitted
 *   (or vice versa) between updates is what hands control of the camera's
 *   position between these two paths — `pitch`/`bearing`/zoom-limits are
 *   never handed over, since `syncMapView` always owns them.
 */
const updateView = (
  state: AdapterState,
  viewId: string,
  viewState: ViewState,
  spec: VisualizationSpec,
  syncFit: (vs: ViewState, s: VisualizationSpec) => void
): void => {
  const { map } = viewState;
  const nextStyle = resolveStyle(spec);
  const previousSpec = viewState.spec;
  viewState.spec = spec;
  // Center/zoom: instant jump when explicit, no-op when omitted; pitch/bearing/
  // zoom-limits sync unconditionally, even while auto-fit (below) is active.
  syncMapView(map, previousSpec.view, spec.view);
  // Auto-fit: animated re-fit of center/zoom when they're omitted and the bbox moved.
  syncFit(viewState, spec);

  const onStyleReady = () => {
    const updated = state.views.get(viewId);
    if (!updated) return;
    syncSourcesAndLayers(map, updated.spec, null);
    reapplyAllMapData(map, updated.spec);
    reapplyLegendDrivenFillPaint(map, updated.spec);
    applyBasemapLabelsVisibility(map, updated.spec);
  };

  if (nextStyle !== viewState.style) {
    viewState.style = nextStyle;
    map.once('style.load', onStyleReady);
    map.setStyle(nextStyle);
    return;
  }
  if (map.isStyleLoaded()) {
    syncSourcesAndLayers(map, spec, previousSpec);
    if (hasMapDataChanged(previousSpec.mapData, spec.mapData)) {
      removeStaleMapData(map, previousSpec.mapData, spec.mapData);
      reapplyAllMapData(map, spec);
      reapplyLegendDrivenFillPaint(map, spec);
    }
    applyBasemapLabelsVisibility(map, spec);
  } else {
    map.once('style.load', onStyleReady);
  }
};

// Factory for the EngineAdapter implementation — one closure over shared
// per-adapter state (`views`, selection, URL-fetch caches) for all views it mounts.
const createMapLibreAdapter = (): EngineAdapter => {
  const _views: ViewMap = new Map();
  let _prevSelection: GeoVisSelection | null = null;
  const _urlFetchPromises = new WeakMap<
    maplibregl.Map,
    Map<string, Promise<GeoJSONBoundingBox | null>>
  >();
  const _currentUrlSpecKeyByMap = new WeakMap<maplibregl.Map, string>();

  const state: AdapterState = {
    views: _views,
    prevSelection: _prevSelection,
    urlFetchPromises: _urlFetchPromises,
    currentUrlSpecKeyByMap: _currentUrlSpecKeyByMap,
  };

  const syncFitClosure = (viewState: ViewState, spec: VisualizationSpec) => {
    syncFitToData(state, viewState, spec);
  };

  return {
    id: 'maplibre',
    getCapabilities: () => {
      return CAPABILITIES;
    },
    mount: (container, spec, viewId) => {
      return mountView(state, container, spec, viewId, syncFitClosure);
    },
    update: (spec) => {
      for (const [viewId, viewState] of _views)
        updateView(state, viewId, viewState, spec, syncFitClosure);
    },
    // Incremental layer/source/mapData edits — no re-mount, unlike `update`.
    applyPatch: (patch) => {
      for (const viewState of _views.values()) dispatchPatch(viewState, patch);
    },
    // Direct camera control (AI action surface), independent of spec.view.
    setView: (options) => {
      for (const viewState of _views.values()) {
        applySetView(viewState.map, options);
      }
    },
    setSelection: (selection) => {
      for (const viewState of _views.values()) {
        applySelectionToMap(
          viewState.map,
          viewState.spec,
          _prevSelection,
          selection
        );
      }
      _prevSelection = selection;
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
