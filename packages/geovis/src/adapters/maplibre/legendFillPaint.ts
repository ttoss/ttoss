import type maplibregl from 'maplibre-gl';

import type { VisualizationSpec } from '../../spec/types';
import { extrusionTransitionMs } from './extrusionLifecycle';
import { transitionExtrusionHeight } from './extrusionTransition';
import {
  isExtrudedLayer,
  polygonFillColorProperty,
  resolveExtrusionHeightExpression,
  resolveLegendFillColorExpression,
} from './layerTranslation';

/**
 * Tracks pending `styledata` listeners keyed by `${layerId}:${property}` per
 * map instance. Allows cancellation of stale listeners when a layer is removed
 * before it ever appears on the map.
 */
const pendingStyleListeners = new WeakMap<
  maplibregl.Map,
  Map<string, () => void>
>();

/**
 * Cancels all pending `styledata` listeners registered for `layerId` on `map`.
 * Should be called whenever a layer is removed from the map.
 */
export const cancelPendingStyleListenersForLayer = (
  map: maplibregl.Map,
  layerId: string
): void => {
  const byKey = pendingStyleListeners.get(map);
  if (!byKey) return;
  for (const [key, listener] of byKey) {
    if (key.startsWith(`${layerId}:`)) {
      map.off('styledata', listener);
      byKey.delete(key);
    }
  }
};

/**
 * Applies a paint property as soon as its layer is on the map, deferring to
 * the next `styledata` event when it is not there yet. Centralised here so all
 * legend-driven paint mutations share one race-free entry point.
 */
export const setPaintWhenReady = (
  map: maplibregl.Map,
  layerId: string,
  property: string,
  value: unknown
): void => {
  const apply = () => {
    if (!map.getLayer(layerId)) return false;
    map.setPaintProperty(
      layerId,
      property,
      value as maplibregl.StyleSpecification
    );
    return true;
  };

  const applyWhenLayerAppears = () => {
    const listenerKey = `${layerId}:${property}`;

    let byKey = pendingStyleListeners.get(map);
    if (!byKey) {
      byKey = new Map();
      pendingStyleListeners.set(map, byKey);
    }

    // Cancel any previous listener for the same layer+property before registering a new one.
    const existing = byKey.get(listenerKey);
    if (existing) {
      map.off('styledata', existing);
    }

    const onStyleData = () => {
      const applied = apply();
      if (!applied) return;
      map.off('styledata', onStyleData);
      pendingStyleListeners.get(map)?.delete(listenerKey);
    };

    byKey.set(listenerKey, onStyleData);
    map.on('styledata', onStyleData);
  };

  // No style-readiness gate: `apply` already returns `false` unless the layer
  // is on the map, and a layer can only be there once the stylesheet parsed —
  // so the layer check is the readiness check, and `styledata` (which fires
  // repeatedly, style load included) is what waits for it. A gate on
  // `isStyleLoaded()` would be both too strict (it also reports `false` while
  // tiles are in flight) and parked on `style.load`, which never fires again
  // after the first parse.
  const applied = apply();
  if (!applied) applyWhenLayerAppears();
};

/** Eases a mounted extruded layer to the height its spec now resolves. */
const reapplyExtrusionHeight = ({
  map,
  spec,
  layer,
}: {
  map: maplibregl.Map;
  spec: VisualizationSpec;
  layer: VisualizationSpec['layers'][number];
}): void => {
  // Defined: the caller only reaches here for a layer extruded in both the
  // spec and the map.
  const height = resolveExtrusionHeightExpression(
    layer,
    spec.legends,
    spec.mapData
  )!;
  transitionExtrusionHeight({
    map,
    layerId: layer.id,
    to: height,
    durationMs:
      layer.visible === false ? 0 : extrusionTransitionMs({ map, layer }),
  });
};

/**
 * Re-applies legend-driven polygon fill expressions for layers with active
 * legends, and the height of extruded ones — its continuous scale tops out at
 * the dataset's largest value, which a `mapData` change can move. The height
 * eases there rather than jumping, like every other height change.
 *
 * A layer mid-swap between `fill` and `fill-extrusion` is skipped: its mounted
 * type rejects the other's paint, and the swap brings the paint in with it.
 */
export const reapplyLegendDrivenFillPaint = (
  map: maplibregl.Map,
  spec: VisualizationSpec
): void => {
  for (const layer of spec.layers) {
    if (layer.geometry !== 'polygon') continue;
    const mountedType = map.getLayer(layer.id)?.type;
    const expectedType = isExtrudedLayer(layer) ? 'fill-extrusion' : 'fill';
    if (mountedType !== undefined && mountedType !== expectedType) continue;
    if (mountedType === 'fill-extrusion') {
      reapplyExtrusionHeight({ map, spec, layer });
    }
    const expression = resolveLegendFillColorExpression(
      layer,
      spec.legends,
      spec.mapData
    );
    if (!expression) continue;
    setPaintWhenReady(
      map,
      layer.id,
      polygonFillColorProperty(layer),
      expression
    );
  }
};
