/* eslint-disable max-lines */
import 'maplibre-gl/dist/maplibre-gl.css';

import { log } from '@ttoss/logger';
import maplibregl from 'maplibre-gl';

import type {
  CapabilitySet,
  EngineAdapter,
  MountedView,
  SetViewOptions,
  SpecPatch,
} from '../../runtime/adapter';
import { applyMapDataPatchToSpec } from '../../spec/mapDataPatch';
import type { VisualizationSpec } from '../../spec/types';
import { toMaplibreLayer } from './layerTranslation';
import { reapplyLegendDrivenFillPaint } from './legendFillPaint';
import {
  applyMapDataPatchToMap,
  reapplyAllMapData,
  removeMapDataFromSource,
} from './mapDataFeatureState';
import { applyLayerPatch, applySourcePatch } from './patchDispatch';
import { toMaplibreSource } from './sourceTranslation';
import { syncSourcesAndLayers } from './syncSourcesAndLayers';

// Re-exports preserved for public API and historical test imports.
export { toMaplibreLayer, toMaplibreSource };

const DEFAULT_STYLE = 'https://demotiles.maplibre.org/style.json';

/**
 * A valid MapLibre style with no sources and no layers, producing a blank canvas.
 * Used when `spec.basemap.visible === false`.
 */
const BLANK_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {},
  layers: [],
};

/**
 * Returns the MapLibre style to use for this spec.
 * When `basemap.visible` is explicitly `false`, returns a blank style so that
 * GeoJSON layers render over a transparent/white canvas with no tile imagery.
 * Otherwise falls back to `basemap.styleUrl` or the MapLibre demo tiles.
 */
const resolveStyle = (
  spec: VisualizationSpec
): string | maplibregl.StyleSpecification => {
  if (spec.basemap?.visible === false) return BLANK_STYLE;
  return spec.basemap?.styleUrl ?? DEFAULT_STYLE;
};

const syncCenter = (
  map: maplibregl.Map,
  prev: VisualizationSpec['view'],
  next: VisualizationSpec['view']
): void => {
  if (!next?.center || next.center.length !== 2) return;
  const [lng, lat] = next.center;
  if (prev?.center?.[0] === lng && prev?.center?.[1] === lat) return;
  map.setCenter(next.center as maplibregl.LngLatLike);
};

const syncZoom = (
  map: maplibregl.Map,
  prev: VisualizationSpec['view'],
  next: VisualizationSpec['view']
): void => {
  if (next?.zoom === undefined || next.zoom === prev?.zoom) return;
  map.setZoom(next.zoom);
};

/** Syncs map camera (center, zoom, pitch, bearing) to `next`, skipping values unchanged from `prev`. */
const syncMapView = (
  map: maplibregl.Map,
  prev: VisualizationSpec['view'],
  next: VisualizationSpec['view']
): void => {
  if (!next) return;
  const p = prev ?? {};
  syncCenter(map, prev, next);
  syncZoom(map, prev, next);
  const pp = p.pitch ?? 0;
  const np = next.pitch ?? 0;
  if (pp !== np) map.setPitch(np);
  const pb = p.bearing ?? 0;
  const nb = next.bearing ?? 0;
  if (pb !== nb) map.setBearing(nb);
};

type MapLibreStyle = string | maplibregl.StyleSpecification;

interface ViewState {
  map: maplibregl.Map;
  spec: VisualizationSpec;
  style: MapLibreStyle;
}

type ViewMap = Map<string, ViewState>;

const createMap = (
  spec: VisualizationSpec,
  container: HTMLElement
): { map: maplibregl.Map; style: MapLibreStyle } => {
  const { view } = spec;
  const style = resolveStyle(spec);
  const map = new maplibregl.Map({
    container,
    style,
    center: (view?.center ?? [0, 0]) as maplibregl.LngLatLike,
    zoom: view?.zoom ?? 1,
    pitch: view?.pitch ?? 0,
    bearing: view?.bearing ?? 0,
  });
  map.addControl(
    new maplibregl.NavigationControl({
      visualizePitch: true,
      visualizeRoll: true,
      showZoom: true,
      showCompass: true,
    })
  );
  return { map, style };
};

const mountView = (
  views: ViewMap,
  container: HTMLElement,
  spec: VisualizationSpec,
  viewId: string
): MountedView => {
  const { map, style } = createMap(spec, container);
  views.set(viewId, { map, spec, style });
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
        /* MapLibre can throw if the map was not fully initialized. */
      }
      views.delete(viewId);
    },
  };
};

const updateView = (
  views: ViewMap,
  viewId: string,
  viewState: ViewState,
  spec: VisualizationSpec
): void => {
  const { map } = viewState;
  const nextStyle = resolveStyle(spec);
  const previousSpec = viewState.spec;
  viewState.spec = spec;
  syncMapView(map, previousSpec.view, spec.view);

  const onStyleReady = () => {
    const updated = views.get(viewId);
    if (!updated) return;
    syncSourcesAndLayers(map, updated.spec, null);
    reapplyAllMapData(map, updated.spec);
    reapplyLegendDrivenFillPaint(map, updated.spec);
  };

  if (nextStyle !== viewState.style) {
    viewState.style = nextStyle;
    map.once('style.load', onStyleReady);
    map.setStyle(nextStyle);
    return;
  }
  if (map.isStyleLoaded()) {
    syncSourcesAndLayers(map, spec, previousSpec);
    if (previousSpec.mapData !== spec.mapData) {
      for (const prevMd of previousSpec.mapData ?? []) {
        const nextMd = (spec.mapData ?? []).find((md) => {
          return md.mapDataId === prevMd.mapDataId;
        });
        if (!nextMd || nextMd !== prevMd) removeMapDataFromSource(map, prevMd);
      }
      reapplyAllMapData(map, spec);
      reapplyLegendDrivenFillPaint(map, spec);
    }
  } else {
    map.once('style.load', onStyleReady);
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

/**
 * Applies an imperative camera move to a single map instance.
 * Uses `flyTo` for animated transitions and `jumpTo` for instant ones.
 * Only camera fields explicitly provided in `options` are applied —
 * `undefined` values are omitted so MapLibre keeps the current camera
 * state for those axes.
 */
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
    try {
      viewState.map.remove();
    } catch {
      /* ignore */
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
      for (const [viewId, viewState] of _views)
        updateView(_views, viewId, viewState, spec);
    },
    applyPatch: (patch) => {
      for (const viewState of _views.values()) dispatchPatch(viewState, patch);
    },
    setView: (options) => {
      for (const viewState of _views.values()) {
        applySetView(viewState.map, options);
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
