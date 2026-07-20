import type maplibregl from 'maplibre-gl';

import type { GeoVisSelection } from '../../runtime/action';
import type { VisualizationSpec } from '../../spec/types';

/**
 * Swaps `feature-state.selected` on one map: clears `prev` (if any), then
 * sets `next` (if any). Consolidates what the click hook (`useMapClick`)
 * used to do directly via `map.setFeatureState` before selection moved to
 * the runtime (PRD-002 Phase 2) — now the single implementation shared by
 * `dispatch({ type: 'select-feature' })` and any future selection source.
 */
const swapSelectedFeatureState = (
  map: maplibregl.Map,
  prev: { sourceId: string; featureId: string | number } | null,
  next: { sourceId: string; featureId: string | number } | null
): void => {
  if (prev) {
    map.setFeatureState(
      { source: prev.sourceId, id: prev.featureId },
      { selected: false }
    );
  }
  if (next) {
    map.setFeatureState(
      { source: next.sourceId, id: next.featureId },
      { selected: true }
    );
  }
};

/** Resolves a `GeoVisSelection`'s `sourceId` from its `layerId` via `spec.layers`. */
const resolveSourceId = (
  spec: VisualizationSpec,
  selection: GeoVisSelection
): string | undefined => {
  return spec.layers.find((l) => {
    return l.id === selection.layerId;
  })?.sourceId;
};

/**
 * Applies (or clears) the current selection on one mounted map, given the
 * spec it was mounted with (to resolve `layerId` → `sourceId`).
 */
export const applySelectionToMap = (
  map: maplibregl.Map,
  spec: VisualizationSpec,
  prev: GeoVisSelection | null,
  next: GeoVisSelection | null
): void => {
  const prevSourceId = prev ? resolveSourceId(spec, prev) : undefined;
  const nextSourceId = next ? resolveSourceId(spec, next) : undefined;
  swapSelectedFeatureState(
    map,
    prev && prevSourceId
      ? { sourceId: prevSourceId, featureId: prev.featureId }
      : null,
    next && nextSourceId
      ? { sourceId: nextSourceId, featureId: next.featureId }
      : null
  );
};
