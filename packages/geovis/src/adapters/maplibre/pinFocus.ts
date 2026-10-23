import type * as maplibregl from 'maplibre-gl';

import type { PinFocus } from '../../runtime/adapter';
import type { VisualizationSpec } from '../../spec/types';

/** The pin each map has in focus; absent while none is. */
const focusByMap = new WeakMap<maplibregl.Map, PinFocus>();

/**
 * Writes each pin layer's visibility: hidden while a pin is in focus, so the
 * caller can draw that pin itself above what it draws around it; otherwise
 * the visibility the spec gives it.
 */
const applyPinFocus = (
  map: maplibregl.Map,
  spec: VisualizationSpec,
  focus: PinFocus | undefined
): void => {
  for (const layer of spec.layers) {
    if (layer.geometry !== 'symbol' || !map.getLayer(layer.id)) continue;
    const hidden = layer.visible === false || focus != null;
    map.setLayoutProperty(layer.id, 'visibility', hidden ? 'none' : 'visible');
  }
};

/**
 * Hides every pin on the map — every `symbol` layer — while `focus` is set,
 * and shows the pins the spec turns on again once it is `null`. The focus is
 * kept per map, so {@link reapplyPinFocus} holds it across spec updates.
 *
 * @param map - The live map.
 * @param spec - The spec the map shows.
 * @param focus - The pin in focus, or `null` to show every pin again.
 */
export const focusPins = (
  map: maplibregl.Map,
  spec: VisualizationSpec,
  focus: PinFocus | null
): void => {
  if (focus) focusByMap.set(map, focus);
  else focusByMap.delete(map);
  applyPinFocus(map, spec, focus ?? undefined);
};

/**
 * Hides the pins again after something wrote their layers' visibility — a
 * sync, a `visible` patch — if a pin is in focus on the map; a no-op
 * otherwise, the visibility just written being the spec's.
 *
 * @param map - The live map.
 * @param spec - The spec the map shows.
 */
export const reapplyPinFocus = (
  map: maplibregl.Map,
  spec: VisualizationSpec
): void => {
  const focus = focusByMap.get(map);
  if (focus) applyPinFocus(map, spec, focus);
};
