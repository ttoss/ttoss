import 'maplibre-gl/dist/maplibre-gl.css';

import maplibregl from 'maplibre-gl';

import type {
  CapabilitySet,
  EngineAdapter,
  MountedView,
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
import type { LayerHostState } from './patchDispatch';
import { applyLayerPatch, applySourcePatch } from './patchDispatch';
import { toMaplibreSource } from './sourceTranslation';
import { syncSourcesAndLayers } from './syncSourcesAndLayers';

// Re-exports preserved for public API and historical test imports.
export { toMaplibreLayer, toMaplibreSource };

const DEFAULT_STYLE = 'https://demotiles.maplibre.org/style.json';

const resolveStyleUrl = (spec: VisualizationSpec): string => {
  return spec.basemap?.styleUrl ?? DEFAULT_STYLE;
};

const syncCenter = (
  map: maplibregl.Map,
  prev: VisualizationSpec['view'],
  next: VisualizationSpec['view']
): void => {
  if (prev.center[0] === next.center[0] && prev.center[1] === next.center[1])
    return;
  map.setCenter(next.center as maplibregl.LngLatLike);
};

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

interface ViewState extends LayerHostState {
  map: maplibregl.Map;
  styleUrl: string;
}

type ViewMap = Map<string, ViewState>;

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
  const nextStyleUrl = resolveStyleUrl(spec);
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
