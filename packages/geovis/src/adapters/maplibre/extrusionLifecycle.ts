import type maplibregl from 'maplibre-gl';

import type { VisualizationLayer } from '../../spec/types';
import {
  DEFAULT_EXTRUSION_TRANSITION_MS,
  type ExtrusionHeight,
  forgetExtrusionHeight,
  transitionExtrusionHeight,
} from './extrusionTransition';

/** A flat layer waiting for its extruded predecessor to finish lying down. */
interface PendingCollapse {
  flat: maplibregl.LayerSpecification;
  /** Restores managed paint order once the flat layer is in. */
  afterSwap: () => void;
}

const pendingCollapses = new WeakMap<
  maplibregl.Map,
  Map<string, PendingCollapse>
>();

/** The duration each layer last animated with, for the collapse that follows. */
const lastDurations = new WeakMap<maplibregl.Map, Map<string, number>>();

const mapFor = <T>(
  store: WeakMap<maplibregl.Map, Map<string, T>>,
  map: maplibregl.Map
): Map<string, T> => {
  const existing = store.get(map);
  if (existing) return existing;
  const created = new Map<string, T>();
  store.set(map, created);
  return created;
};

/**
 * How long a layer's prisms take to rise and fall: its own `transitionMs`, the
 * duration it last rose with once it has lost `extrusion` (a collapsing layer
 * no longer declares one), or the default.
 */
export const extrusionTransitionMs = ({
  map,
  layer,
}: {
  map: maplibregl.Map;
  layer: VisualizationLayer;
}): number => {
  const declared = layer.extrusion?.transitionMs;
  const durations = mapFor(lastDurations, map);
  if (declared !== undefined) {
    durations.set(layer.id, declared);
    return declared;
  }
  if (layer.extrusion) {
    durations.set(layer.id, DEFAULT_EXTRUSION_TRANSITION_MS);
    return DEFAULT_EXTRUSION_TRANSITION_MS;
  }
  return durations.get(layer.id) ?? DEFAULT_EXTRUSION_TRANSITION_MS;
};

/** Drops every bit of extrusion state for a layer leaving the map. */
export const forgetExtrusionLayer = (
  map: maplibregl.Map,
  layerId: string
): void => {
  forgetExtrusionHeight(map, layerId);
  mapFor(pendingCollapses, map).delete(layerId);
};

const heightOf = (layer: maplibregl.LayerSpecification): ExtrusionHeight => {
  const paint = (layer as { paint?: Record<string, unknown> }).paint;
  return (paint?.['fill-extrusion-height'] ?? 0) as ExtrusionHeight;
};

/** Swaps a collapsed extruded layer for the flat one waiting on it. */
const finishCollapse = (map: maplibregl.Map, layerId: string): void => {
  const pending = mapFor(pendingCollapses, map).get(layerId);
  // Gone means the layer was removed or the collapse was called off.
  if (!pending || !map.getLayer(layerId)) return;
  mapFor(pendingCollapses, map).delete(layerId);
  forgetExtrusionHeight(map, layerId);
  map.removeLayer(layerId);
  map.addLayer(pending.flat);
  pending.afterSwap();
};

interface UpsertExtrusionParams {
  map: maplibregl.Map;
  layer: VisualizationLayer;
  /** The layer as the current spec translates it. */
  desiredLayer: maplibregl.LayerSpecification;
  /** Writes visibility, filter and paint onto the mounted layer. */
  updateMounted: () => void;
  /** Restores managed paint order after a deferred swap. */
  afterSwap: () => void;
}

/** 2D → 3D: the flat layer goes, the extruded one comes in flat and rises. */
const grow = ({ map, layer, desiredLayer }: UpsertExtrusionParams): void => {
  mapFor(pendingCollapses, map).delete(layer.id);
  if (map.getLayer(layer.id)) map.removeLayer(layer.id);
  const height = heightOf(desiredLayer);
  const durationMs =
    layer.visible === false ? 0 : extrusionTransitionMs({ map, layer });
  const paint = (desiredLayer as { paint?: Record<string, unknown> }).paint;
  map.addLayer({
    ...desiredLayer,
    paint: { ...paint, 'fill-extrusion-height': durationMs > 0 ? 0 : height },
  } as maplibregl.LayerSpecification);
  transitionExtrusionHeight({
    map,
    layerId: layer.id,
    from: durationMs > 0 ? 0 : height,
    to: height,
    durationMs,
  });
};

/**
 * 3D → 2D: the prisms lie down first, and only then is the layer swapped for
 * its flat self — MapLibre cannot change a layer's type in place. Updates that
 * arrive meanwhile only refresh the flat layer waiting to come in.
 */
const collapse = ({
  map,
  layer,
  desiredLayer,
  afterSwap,
}: UpsertExtrusionParams): void => {
  const pending = mapFor(pendingCollapses, map);
  const alreadyCollapsing = pending.has(layer.id);
  pending.set(layer.id, { flat: desiredLayer, afterSwap });
  const visibility = layer.visible === false ? 'none' : 'visible';
  map.setLayoutProperty(layer.id, 'visibility', visibility);

  if (layer.visible === false) {
    finishCollapse(map, layer.id);
    return;
  }
  if (alreadyCollapsing) return;
  transitionExtrusionHeight({
    map,
    layerId: layer.id,
    to: 0,
    durationMs: extrusionTransitionMs({ map, layer }),
    onComplete: () => {
      finishCollapse(map, layer.id);
    },
  });
};

/**
 * Adds or updates a polygon layer that is, or is becoming, or was extruded —
 * the cases where the plain add-or-update path would snap.
 *
 * Returns `false` for every other layer, leaving it to that path. A layer
 * staying extruded is updated in place: `updateMounted` writes its paint, and
 * the height write inside it eases (see `reapplyLayerPaint`), so a new
 * `maxHeight` or new data moves the prisms rather than jumping them.
 *
 * @returns Whether the layer was handled here.
 */
export const upsertExtrusionAwareLayer = (
  params: UpsertExtrusionParams
): boolean => {
  const { map, layer, desiredLayer, updateMounted } = params;
  const mountedExtruded = map.getLayer(layer.id)?.type === 'fill-extrusion';
  const desiredExtruded = desiredLayer.type === 'fill-extrusion';

  if (desiredExtruded && mountedExtruded) {
    // Back to 3D mid-collapse: calling it off here, and easing towards the new
    // height below, picks the prisms up from wherever they had got to.
    mapFor(pendingCollapses, map).delete(layer.id);
    updateMounted();
    return true;
  }
  if (desiredExtruded) {
    grow(params);
    return true;
  }
  if (mountedExtruded) {
    collapse(params);
    return true;
  }
  return false;
};
