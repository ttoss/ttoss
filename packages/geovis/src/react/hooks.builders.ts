import type { Map as MapLibreMap, MapLayerMouseEvent } from 'maplibre-gl';
import type * as React from 'react';

import type { GeoVisRuntime } from '../runtime/createRuntime';
import type { VisualizationSpec } from '../spec/types';
import type { MapClickInfo, MapHoverInfo } from './contexts';

// ASCII control characters chosen as internal separators so arbitrary
// characters in layer/source IDs (e.g. ':' in URL-based IDs) cannot corrupt
// the encode/decode roundtrip used to build `trackedKey`.
export const TRACKED_FIELD_SEP = '\x1f'; // Unit Separator
export const TRACKED_RECORD_SEP = '\x1e'; // Record Separator

/**
 * Normalises a `feature-state.value` read from MapLibre to the public
 * `MapHoverInfo.value` shape: numbers must be finite, strings pass through,
 * everything else collapses to `null`.
 */
export const coerceFeatureStateValue = (
  raw: unknown
): number | string | null => {
  if (typeof raw === 'number') {
    return Number.isFinite(raw) ? raw : null;
  }
  if (typeof raw === 'string') return raw;
  return null;
};

export type PrevFeatureState = {
  current: { sourceId: string; id: string | number } | null;
};

export type TrackedHoverEntry = {
  layerId: string;
  sourceId: string;
  hasHoverPaint: boolean;
};

/**
 * Decodes the `trackedKey` string (built in `useMapHover`'s `useMemo`) back
 * into a structured array so the `useEffect` body can consume it directly
 * without inline string-splitting logic.
 */
export const decodeHoverTrackedKey = (key: string): TrackedHoverEntry[] => {
  return key.split(TRACKED_RECORD_SEP).map((entry) => {
    const [layerId, sourceId, hasHoverPaint] = entry.split(TRACKED_FIELD_SEP);
    return { layerId, sourceId, hasHoverPaint: hasHoverPaint === '1' };
  });
};

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

export const clearHover = (
  map: MapLibreMap,
  setHover: React.Dispatch<React.SetStateAction<MapHoverInfo | null>>,
  prevHoveredState?: PrevFeatureState
) => {
  if (prevHoveredState?.current) {
    map.setFeatureState(
      {
        source: prevHoveredState.current.sourceId,
        id: prevHoveredState.current.id,
      },
      { hover: false }
    );
    prevHoveredState.current = null;
  }
  map.getCanvas().style.cursor = '';
  setHover(null);
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

export interface BuildHandleMoveParams {
  map: MapLibreMap;
  layerId: string;
  sourceByLayerId: Map<string, string>;
  setHover: React.Dispatch<React.SetStateAction<MapHoverInfo | null>>;
  /** Mutable ref updated on every valid mousemove; used by the window-focus recheck. */
  lastPointRef: React.MutableRefObject<{ x: number; y: number } | null>;
  /** Tracks the last feature whose hover state was set so it can be cleared on leave. */
  prevHoveredState: PrevFeatureState;
  /** Layer IDs that have `hoverPaint` declared; drives `setFeatureState({ hover })`. */
  hoverPaintLayerIds: Set<string>;
}

export const buildHandleMove = ({
  map,
  layerId,
  sourceByLayerId,
  setHover,
  lastPointRef,
  prevHoveredState,
  hoverPaintLayerIds,
}: BuildHandleMoveParams) => {
  return (event: MapLayerMouseEvent) => {
    // Prefer the delegated `features` payload (already scoped to `layerId`)
    // to avoid an extra `queryRenderedFeatures` call on every mousemove and
    // to disambiguate when multiple tracked layers overlap at the cursor.
    const delegatedFeature = event.features?.[0];
    const feature =
      delegatedFeature ??
      map.queryRenderedFeatures(event.point, { layers: [layerId] })[0];
    if (!feature || feature.id == null) {
      clearHover(map, setHover, prevHoveredState);
      return;
    }
    const resolvedLayerId = feature.layer?.id ?? layerId;
    const sourceId = sourceByLayerId.get(resolvedLayerId);
    // Defensive: if the source mapping is missing for any reason, treat the
    // hover as cleared so the cursor/tooltip do not stay stuck on a stale
    // value from a previous valid hover.
    if (!sourceId) {
      clearHover(map, setHover, prevHoveredState);
      return;
    }

    // Swap hover feature-state: clear previous feature, mark new one.
    if (prevHoveredState.current) {
      map.setFeatureState(
        {
          source: prevHoveredState.current.sourceId,
          id: prevHoveredState.current.id,
        },
        { hover: false }
      );
    }
    if (hoverPaintLayerIds.has(resolvedLayerId)) {
      map.setFeatureState(
        { source: sourceId, id: feature.id },
        { hover: true }
      );
      prevHoveredState.current = { sourceId, id: feature.id };
    } else {
      prevHoveredState.current = null;
    }

    const state = map.getFeatureState({
      source: sourceId,
      id: feature.id,
    }) as { value?: unknown };

    // Keep the last valid cursor position so the window-focus recheck can
    // query the same point without waiting for a new mousemove event.
    lastPointRef.current = { x: event.point.x, y: event.point.y };
    const rect = map.getCanvas().getBoundingClientRect();
    setHover({
      layerId: resolvedLayerId,
      sourceId,
      featureId: feature.id,
      value: coerceFeatureStateValue(state.value),
      point: { x: rect.left + event.point.x, y: rect.top + event.point.y },
    });
  };
};

export interface BuildHandleWindowFocusParams {
  map: MapLibreMap;
  trackedLayerIds: string[];
  sourceByLayerId: Map<string, string>;
  lastPointRef: React.MutableRefObject<{ x: number; y: number } | null>;
  setHover: React.Dispatch<React.SetStateAction<MapHoverInfo | null>>;
  prevHoveredState: PrevFeatureState;
  hoverPaintLayerIds: Set<string>;
}

/**
 * Builds the handler that rechecks the hover state when the browser window
 * regains focus (e.g. after alt-tab or switching back to the tab).
 *
 * @remarks
 * Browsers do not synthesise a new `mousemove` event when a window regains
 * focus, so the tooltip would stay invisible even if the cursor never moved
 * away from the map. This handler re-runs `queryRenderedFeatures` against the
 * last known cursor position and restores the hover if a tracked feature is
 * still under the cursor, making the tooltip reappear without requiring any
 * physical mouse movement from the user.
 */
export const buildHandleWindowFocus = ({
  map,
  trackedLayerIds,
  sourceByLayerId,
  lastPointRef,
  setHover,
  prevHoveredState,
  hoverPaintLayerIds,
}: BuildHandleWindowFocusParams) => {
  return () => {
    const canvasPoint = lastPointRef.current;
    if (!canvasPoint) return;

    const hits = map.queryRenderedFeatures([canvasPoint.x, canvasPoint.y], {
      layers: trackedLayerIds,
    });
    const feature = hits[0];
    if (!feature || feature.id == null) {
      clearHover(map, setHover, prevHoveredState);
      return;
    }
    const resolvedLayerId = feature.layer?.id ?? trackedLayerIds[0];
    const sourceId = sourceByLayerId.get(resolvedLayerId);
    if (!sourceId) {
      clearHover(map, setHover, prevHoveredState);
      return;
    }
    // Restore hover feature-state on window re-focus.
    if (prevHoveredState.current) {
      map.setFeatureState(
        {
          source: prevHoveredState.current.sourceId,
          id: prevHoveredState.current.id,
        },
        { hover: false }
      );
    }
    if (hoverPaintLayerIds.has(resolvedLayerId)) {
      map.setFeatureState(
        { source: sourceId, id: feature.id },
        { hover: true }
      );
      prevHoveredState.current = { sourceId, id: feature.id };
    } else {
      prevHoveredState.current = null;
    }
    const state = map.getFeatureState({
      source: sourceId,
      id: feature.id,
    }) as { value?: unknown };
    // Convert the retained canvas-relative point to viewport-absolute so
    // the snapshot matches the coordinate space produced by buildHandleMove.
    const rect = map.getCanvas().getBoundingClientRect();
    setHover({
      layerId: resolvedLayerId,
      sourceId,
      featureId: feature.id,
      value: coerceFeatureStateValue(state.value),
      point: { x: rect.left + canvasPoint.x, y: rect.top + canvasPoint.y },
    });
  };
};

export interface DecodedHoverTracking {
  tracked: TrackedHoverEntry[];
  sourceByLayerId: Map<string, string>;
  hoverPaintLayerIds: Set<string>;
  trackedLayerIds: string[];
}

export const buildHoverTracking = (
  trackedKey: string
): DecodedHoverTracking => {
  const tracked = decodeHoverTrackedKey(trackedKey);
  const sourceByLayerId = new Map(
    tracked.map((t) => {
      return [t.layerId, t.sourceId] as const;
    })
  );
  const hoverPaintLayerIds = new Set(
    tracked
      .filter((t) => {
        return t.hasHoverPaint;
      })
      .map((t) => {
        return t.layerId;
      })
  );
  const trackedLayerIds = tracked.map((t) => {
    return t.layerId;
  });
  return { tracked, sourceByLayerId, hoverPaintLayerIds, trackedLayerIds };
};

/**
 * Encodes the hover-tracked polygon layers into a stable string key used as a
 * `useEffect` dependency. Only polygon layers with `activeLegendId` or
 * `hoverPaint` are included; non-polygons are intentionally excluded.
 */
export const buildHoverTrackedKey = (
  layers: VisualizationSpec['layers']
): string => {
  return layers
    .filter((layer) => {
      return (
        layer.geometry === 'polygon' &&
        (layer.activeLegendId != null || layer.hoverPaint != null)
      );
    })
    .map((layer) => {
      return `${layer.id}${TRACKED_FIELD_SEP}${layer.sourceId}${TRACKED_FIELD_SEP}${layer.hoverPaint ? '1' : '0'}`;
    })
    .join(TRACKED_RECORD_SEP);
};

/**
 * Returns the set of layer IDs that declare `click` or `clickAnchor` and
 * therefore warrant a pointer cursor on hover.
 */
export const buildPointerLayerIds = (
  layers: VisualizationSpec['layers']
): Set<string> => {
  return new Set(
    layers
      .filter((layer) => {
        return layer.click != null || layer.clickAnchor != null;
      })
      .map((layer) => {
        return layer.id;
      })
  );
};

export interface BuildHandleGlobalCursorParams {
  map: MapLibreMap;
  /** Layer IDs that declare `click` or `clickAnchor`; only these get `cursor: pointer`. */
  pointerLayerIds: Set<string>;
}

/**
 * Builds the global (non-layer-scoped) `mousemove` handler that sets the map
 * canvas cursor. Because MapLibre dispatches map-level `mousemove` before
 * layer-scoped events, this handler runs first and its value is then overridden
 * by per-layer handlers — which is fine: the per-layer handlers do not touch
 * the cursor, so this handler's decision always stands.
 *
 * Sets `pointer` when the cursor is over any layer in `pointerLayerIds`,
 * `default` otherwise (including when `pointerLayerIds` is empty).
 */
export const buildHandleGlobalCursor = ({
  map,
  pointerLayerIds,
}: BuildHandleGlobalCursorParams) => {
  return (event: { point: { x: number; y: number } }) => {
    const hits =
      pointerLayerIds.size > 0
        ? map.queryRenderedFeatures(
            [event.point.x, event.point.y] as [number, number],
            { layers: [...pointerLayerIds] }
          )
        : [];
    map.getCanvas().style.cursor = hits.length > 0 ? 'pointer' : 'default';
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
