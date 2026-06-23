import type maplibregl from 'maplibre-gl';

import type { VisualizationSpec } from '../../spec/types';
import { resolveLegendFillColorExpression } from './layerTranslation';

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
 * Applies a paint property immediately when the map's style is loaded,
 * otherwise defers the assignment to the next `style.load` event. Centralised
 * here so all legend-driven paint mutations share one race-free entry point.
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

  if (map.isStyleLoaded()) {
    const applied = apply();
    if (!applied) applyWhenLayerAppears();
    return;
  }

  map.once('style.load', () => {
    const applied = apply();
    if (!applied) applyWhenLayerAppears();
  });
};

/** Re-applies legend-driven polygon fill expressions for layers with active legends. */
export const reapplyLegendDrivenFillPaint = (
  map: maplibregl.Map,
  spec: VisualizationSpec
): void => {
  for (const layer of spec.layers) {
    if (layer.geometry !== 'polygon') continue;
    const expression = resolveLegendFillColorExpression(
      layer,
      spec.legends,
      spec.mapData
    );
    if (!expression) continue;
    setPaintWhenReady(map, layer.id, 'fill-color', expression);
  }
};
