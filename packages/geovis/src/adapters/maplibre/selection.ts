import type maplibregl from 'maplibre-gl';

import type { GeoVisSelection } from '../../runtime/action';
import type { VisualizationSpec } from '../../spec/types';
import { resolveSourceLayerFor } from './syncSourcesAndLayers';

/** One end of a selection swap, already resolved to source coordinates. */
type SelectionTarget = {
  sourceId: string;
  /** Layer name inside the tiles; `undefined` for `geojson` sources. */
  sourceLayer?: string;
  featureId: string | number;
};

/**
 * Builds the `setFeatureState` target, carrying `sourceLayer` when the layer
 * declares one. MapLibre requires it for vector sources: without it the call
 * fires `'The sourceLayer parameter must be provided for vector source types.'`
 * and writes nothing, so the `-selected-outline`/`-click-anchor` companions —
 * which filter on `feature-state.selected` — never light up on a tiled layer.
 * Resolved through `resolveSourceLayerFor`, the same helper those companion
 * layers are mounted with, so the write cannot address a different tile layer
 * than the one reading it.
 */
const featureStateTarget = (entry: SelectionTarget) => {
  return entry.sourceLayer
    ? {
        source: entry.sourceId,
        sourceLayer: entry.sourceLayer,
        id: entry.featureId,
      }
    : { source: entry.sourceId, id: entry.featureId };
};

/**
 * Swaps `feature-state.selected` on one map: clears `prev` (if any), then
 * sets `next` (if any). Consolidates what the click hook (`useMapClick`)
 * used to do directly via `map.setFeatureState` before selection moved to
 * the runtime (PRD-002 Phase 2) — now the single implementation shared by
 * `dispatch({ type: 'select-feature' })` and any future selection source.
 */
const swapSelectedFeatureState = (
  map: maplibregl.Map,
  prev: SelectionTarget | null,
  next: SelectionTarget | null
): void => {
  if (prev) {
    map.setFeatureState(featureStateTarget(prev), { selected: false });
  }
  if (next) {
    map.setFeatureState(featureStateTarget(next), { selected: true });
  }
};

/** Resolves the `VisualizationLayer` a `GeoVisSelection` points at. */
const resolveLayer = (spec: VisualizationSpec, selection: GeoVisSelection) => {
  return spec.layers.find((l) => {
    return l.id === selection.layerId;
  });
};

/**
 * Applies (or clears) the current selection on one mounted map, given the
 * spec it was mounted with (to resolve `layerId` → `sourceId`/`sourceLayer`).
 */
export const applySelectionToMap = (
  map: maplibregl.Map,
  spec: VisualizationSpec,
  prev: GeoVisSelection | null,
  next: GeoVisSelection | null
): void => {
  const prevLayer = prev ? resolveLayer(spec, prev) : undefined;
  const nextLayer = next ? resolveLayer(spec, next) : undefined;
  swapSelectedFeatureState(
    map,
    prev && prevLayer?.sourceId
      ? {
          sourceId: prevLayer.sourceId,
          sourceLayer: resolveSourceLayerFor(spec, prevLayer),
          featureId: prev.featureId,
        }
      : null,
    next && nextLayer?.sourceId
      ? {
          sourceId: nextLayer.sourceId,
          sourceLayer: resolveSourceLayerFor(spec, nextLayer),
          featureId: next.featureId,
        }
      : null
  );
};
