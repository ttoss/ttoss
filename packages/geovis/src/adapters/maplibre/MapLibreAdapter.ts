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

const hasExplicitView = (view: VisualizationSpec['view']): boolean => {
  return view?.center !== undefined || view?.zoom !== undefined;
};

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

const mountView = (
  state: AdapterState,
  container: HTMLElement,
  spec: VisualizationSpec,
  viewId: string,
  syncFit: (vs: ViewState, s: VisualizationSpec) => void
): MountedView => {
  const { map, style } = createMap(spec, container);
  const viewState: ViewState = {
    map,
    spec,
    style,
    fitBbox: null,
    detachFit: null,
  };
  state.views.set(viewId, viewState);
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
  syncMapView(map, previousSpec.view, spec.view);
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
    applyPatch: (patch) => {
      for (const viewState of _views.values()) dispatchPatch(viewState, patch);
    },
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
