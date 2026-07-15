import type maplibregl from 'maplibre-gl';

import type { SpecPatch } from '../../runtime/adapter';
import type {
  DataSource,
  VisualizationLayer,
  VisualizationSpec,
} from '../../spec/types';
import { stripUndefinedPaint, toMaplibreLayer } from './layerTranslation';
import {
  cancelPendingStyleListenersForLayer,
  setPaintWhenReady,
} from './legendFillPaint';
import { specPaintKeyToMaplibre } from './paintKeyMap';
import {
  resolvePromoteIdForSource,
  toMaplibreSource,
} from './sourceTranslation';
import {
  upsertClickAnchorCompanion,
  upsertOutlineCompanions,
} from './syncSourcesAndLayers';

export interface LayerHostState {
  spec: VisualizationSpec;
}

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
    stripUndefinedPaint(
      toMaplibreLayer(
        newLayer,
        effectiveSourceLayer,
        viewState.spec.legends,
        viewState.spec.mapData,
        viewState.spec.scaleMaxValue
      )
    )
  );
  viewState.spec = {
    ...viewState.spec,
    layers: [...viewState.spec.layers, newLayer],
  };
};

const applyLayerRemove = (
  map: maplibregl.Map,
  viewState: LayerHostState,
  layerId: string
): void => {
  cancelPendingStyleListenersForLayer(map, layerId);
  if (map.getLayer(layerId)) map.removeLayer(layerId);
  viewState.spec = {
    ...viewState.spec,
    layers: viewState.spec.layers.filter((l) => {
      return l.id !== layerId;
    }),
  };
};

/**
 * Applies a `layer.<id>.visible` replace: flips the main layer's MapLibre
 * `visibility` layout property and re-syncs its outline/click-anchor
 * companion layers (which derive their own visibility from `layer.visible`)
 * without a full `syncSourcesAndLayers` pass — added for
 * `dispatch({ type: 'toggle-layer' })` (PRD-002), same imperative effect as
 * a full `update()` for this one field, at patch cost.
 */
const applyLayerVisibleReplace = (
  map: maplibregl.Map,
  viewState: LayerHostState,
  layerId: string,
  value: unknown
): void => {
  const layerIndex = viewState.spec.layers.findIndex((l) => {
    return l.id === layerId;
  });
  if (layerIndex === -1) return;
  const nextVisible = value as boolean;
  if (map.getLayer(layerId)) {
    map.setLayoutProperty(
      layerId,
      'visibility',
      nextVisible === false ? 'none' : 'visible'
    );
  }
  const nextLayer: VisualizationLayer = {
    ...viewState.spec.layers[layerIndex],
    visible: nextVisible,
  };
  viewState.spec = {
    ...viewState.spec,
    layers: viewState.spec.layers.map((l, i) => {
      return i === layerIndex ? nextLayer : l;
    }),
  };
  const source = viewState.spec.sources.find((s) => {
    return s.id === nextLayer.sourceId;
  });
  const sourceLayer =
    nextLayer.sourceLayer ??
    (source && 'sourceLayer' in source
      ? (source as { sourceLayer?: string }).sourceLayer
      : undefined);
  upsertOutlineCompanions(map, nextLayer, sourceLayer);
  upsertClickAnchorCompanion(map, nextLayer, sourceLayer);
};

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
  const layerIndex = viewState.spec.layers.findIndex((l) => {
    return l.id === layerId;
  });
  if (layerIndex === -1) return;
  const layer = viewState.spec.layers[layerIndex];
  const maplibreKey = specPaintKeyToMaplibre(specKey, layer.geometry);
  if (!maplibreKey) return;
  setPaintWhenReady(map, layerId, maplibreKey, value);
  viewState.spec = {
    ...viewState.spec,
    layers: viewState.spec.layers.map((l, i) => {
      if (i !== layerIndex) return l;
      return { ...l, paint: { ...l.paint, [specKey]: value } };
    }),
  };
};

/** Dispatches a layer-targeted patch to add, remove, or paint-replace. */
export const applyLayerPatch = (
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
    const parts = patch.path.split('.');
    const layerId = parts[1];
    if (parts.length === 3 && parts[2] === 'visible' && layerId) {
      applyLayerVisibleReplace(map, viewState, layerId, patch.value);
      return;
    }
    applyLayerPaintReplace(map, viewState, patch.path, patch.value);
  }
};

/** Dispatches a source-targeted patch; on `remove`, also removes layers that reference the source. */
export const applySourcePatch = (
  map: maplibregl.Map,
  viewState: LayerHostState,
  patch: SpecPatch & { target: 'source' }
): void => {
  if (patch.op === 'add' && patch.value != null) {
    const newSource = patch.value as DataSource;
    if (map.getSource(newSource.id)) return;
    map.addSource(
      newSource.id,
      toMaplibreSource(newSource, {
        promoteId: resolvePromoteIdForSource(viewState.spec, newSource.id),
      })
    );
    viewState.spec = {
      ...viewState.spec,
      sources: [...viewState.spec.sources, newSource],
    };
    return;
  }
  if (patch.op !== 'remove') return;
  const sourceId = patch.value as string;
  if (map.getSource(sourceId)) {
    for (const layer of viewState.spec.layers) {
      if (layer.sourceId === sourceId && map.getLayer(layer.id)) {
        cancelPendingStyleListenersForLayer(map, layer.id);
        map.removeLayer(layer.id);
      }
    }
    map.removeSource(sourceId);
  }
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
