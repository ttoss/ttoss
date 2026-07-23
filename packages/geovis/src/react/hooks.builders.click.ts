import type {
  Map as MapLibreMap,
  MapLayerMouseEvent,
  MapMouseEvent,
} from 'maplibre-gl';
import type * as React from 'react';

import type { GeoVisRuntime } from '../runtime/createRuntime';
import type { MapClickInfo } from './contexts';
import {
  coerceFeatureStateValue,
  TRACKED_FIELD_SEP,
  TRACKED_RECORD_SEP,
} from './hooks.builders';

export type TrackedClickEntry = {
  layerId: string;
  sourceId: string;
  hasSelectedPaint: boolean;
};

/**
 * Decodes the `trackedKey` string (built in `useMapClick`'s `useMemo`) back
 * into a structured array so the `useEffect` body can consume it directly
 * without inline string-splitting logic.
 */
export const decodeClickTrackedKey = (key: string): TrackedClickEntry[] => {
  return key.split(TRACKED_RECORD_SEP).map((entry) => {
    const [layerId, sourceId, hasSelectedPaint] =
      entry.split(TRACKED_FIELD_SEP);
    return { layerId, sourceId, hasSelectedPaint: hasSelectedPaint === '1' };
  });
};

/**
 * Clears whatever the runtime currently has selected by dispatching
 * `select-feature` with `featureId: null` — a no-op when nothing is
 * selected. Replaces the old direct `map.setFeatureState({ selected: false })`
 * call now that selection is runtime-level state, shared with `dispatch()`
 * (PRD-002 Phase 2): the adapter (`setSelection`) is what actually clears the
 * feature-state, from the same code path a `select-feature` dispatch uses.
 */
export const dispatchClearSelection = (runtime: GeoVisRuntime): void => {
  const current = runtime.getSelection();
  if (current) {
    runtime.dispatch({
      type: 'select-feature',
      layerId: current.layerId,
      featureId: null,
    });
  }
};

/**
 * Wires the two ways a click selection dismisses itself without a direct
 * feature click: clicking empty space (no tracked layer hit at that point)
 * and pressing Escape. Both call the same `dismissSelection`, so a
 * consumer-triggered dismiss (e.g. an inspector panel's dismiss button)
 * reaches the identical reset by calling it too, instead of re-implementing
 * this pair of listeners.
 *
 * @returns A cleanup function that removes both listeners.
 */
export const attachClickDismissListeners = ({
  map,
  trackedLayerIds,
  dismissSelection,
}: {
  map: MapLibreMap;
  trackedLayerIds: string[];
  dismissSelection: () => void;
}): (() => void) => {
  const handleOutsideClick = (event: MapMouseEvent) => {
    const hits = map.queryRenderedFeatures(event.point, {
      layers: trackedLayerIds,
    });
    if (!hits || hits.length === 0) {
      dismissSelection();
    }
  };
  map.on('click', handleOutsideClick);

  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') dismissSelection();
  };
  window.addEventListener('keydown', handleEscape);

  return () => {
    map.off('click', handleOutsideClick);
    window.removeEventListener('keydown', handleEscape);
  };
};

export interface BuildHandleClickParams {
  map: MapLibreMap;
  layerId: string;
  sourceByLayerId: Map<string, string>;
  setClick: React.Dispatch<React.SetStateAction<MapClickInfo | null>>;
  runtime: GeoVisRuntime;
}

/**
 * Builds the per-layer click handler that reads the clicked feature's
 * `feature-state` and calls `setClick` with the resulting {@link MapClickInfo}.
 * Extracted at module scope (mirrors `buildHandleMove`) so `useMapClick`
 * stays under the `max-lines-per-function` threshold.
 *
 * Dispatches `select-feature` on the runtime for every click, regardless of
 * whether the layer declares `selectedPaint`/`clickAnchor` — the resulting
 * `feature-state.selected` write is inert for layers with no companion layer
 * consuming it, so this no longer needs the old per-layer gate.
 */
export const buildHandleClick = ({
  map,
  layerId,
  sourceByLayerId,
  setClick,
  runtime,
}: BuildHandleClickParams) => {
  return (event: MapLayerMouseEvent) => {
    const feature = event.features?.[0];
    if (!feature || feature.id == null) {
      dispatchClearSelection(runtime);
      setClick(null);
      return;
    }
    const resolvedLayerId = feature.layer?.id ?? layerId;
    const sourceId = sourceByLayerId.get(resolvedLayerId);
    if (!sourceId) {
      dispatchClearSelection(runtime);
      setClick(null);
      return;
    }

    runtime.dispatch({
      type: 'select-feature',
      layerId: resolvedLayerId,
      featureId: feature.id,
    });

    const state = map.getFeatureState({
      source: sourceId,
      id: feature.id,
    }) as { value?: unknown };

    setClick({
      layerId: resolvedLayerId,
      sourceId,
      featureId: feature.id,
      value: coerceFeatureStateValue(state.value),
      lngLat: [event.lngLat.lng, event.lngLat.lat],
      point: { x: event.point.x, y: event.point.y },
    });
  };
};

export interface DecodedClickTracking {
  tracked: TrackedClickEntry[];
  sourceByLayerId: Map<string, string>;
}

export const buildClickTracking = (
  trackedKey: string
): DecodedClickTracking => {
  const tracked = decodeClickTrackedKey(trackedKey);
  const sourceByLayerId = new Map(
    tracked.map((t) => {
      return [t.layerId, t.sourceId] as const;
    })
  );
  return { tracked, sourceByLayerId };
};
