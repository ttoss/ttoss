import type maplibregl from 'maplibre-gl';

import type { VisualizationSpec } from '../../spec/types';

/**
 * Suffixes of the companion layers that GeoVis generates per `spec.layers`
 * entry. These are managed by the layer-sync pipeline and must not be touched
 * when restoring basemap label visibility.
 */
const COMPANION_SUFFIXES = [
  '-hover-outline',
  '-selected-outline',
  '-click-anchor',
] as const;

/**
 * Collects the ids of every layer GeoVis manages from `spec.layers` — the user
 * layers themselves plus their generated companion layers. Used to leave
 * user-driven visibility untouched when restoring basemap labels.
 */
const collectManagedLayerIds = (spec: VisualizationSpec): Set<string> => {
  const ids = new Set<string>();
  for (const layer of spec.layers) {
    ids.add(layer.id);
    for (const suffix of COMPANION_SUFFIXES) {
      ids.add(`${layer.id}${suffix}`);
    }
  }
  return ids;
};

/**
 * Resolves the visibility to apply to a single `symbol` layer, or `null` when
 * the layer must be left untouched.
 *
 * - When labels are hidden, every symbol layer becomes `'none'`.
 * - When labels are shown, only basemap layers are restored to `'visible'`;
 *   managed (user) layers are skipped so their own visibility wins.
 */
const resolveSymbolVisibility = (
  layerId: string,
  labelsVisible: boolean,
  managedIds: Set<string>
): 'none' | 'visible' | null => {
  if (!labelsVisible) {
    return 'none';
  }
  return managedIds.has(layerId) ? null : 'visible';
};

/**
 * Applies `spec.basemap.labels` to the live map's `symbol` layers.
 *
 * - `labels === false` hides **every** `symbol` layer — basemap labels/icons
 *   AND any user-defined `symbol` layers — matching the historical
 *   `HideBasemapLabels` component behaviour.
 * - `labels === true` restores the basemap's own `symbol` layers to `visible`.
 *   User layers and their companions are skipped so their own visibility
 *   management (`layer.visible`, feature-state filters) is preserved.
 * - `labels === undefined` leaves the style untouched, preserving the basemap's
 *   native label visibility.
 *
 * Safe to call repeatedly and on every sync; it is a no-op until the style is
 * loaded. Re-running it after layer syncs and basemap/style changes keeps the
 * declared `labels` state in effect (e.g. after `upsertLayers` rewrites a user
 * symbol layer's visibility, or after a `setStyle` reload).
 */
export const applyBasemapLabelsVisibility = (
  map: maplibregl.Map,
  spec: VisualizationSpec
): void => {
  const labels = spec.basemap?.labels;
  if (labels === undefined || !map.isStyleLoaded()) {
    return;
  }

  const managedIds = collectManagedLayerIds(spec);
  const layers = map.getStyle()?.layers ?? [];

  for (const layer of layers) {
    if (layer.type !== 'symbol') {
      continue;
    }
    const visibility = resolveSymbolVisibility(layer.id, labels, managedIds);
    if (visibility !== null) {
      map.setLayoutProperty(layer.id, 'visibility', visibility);
    }
  }
};
