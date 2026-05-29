import type { Map as MapLibreMap, MapLayerMouseEvent } from 'maplibre-gl';
import type * as React from 'react';

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

export const clearSelected = (
  map: MapLibreMap,
  prevSelectedState: PrevFeatureState
) => {
  if (prevSelectedState.current) {
    map.setFeatureState(
      {
        source: prevSelectedState.current.sourceId,
        id: prevSelectedState.current.id,
      },
      { selected: false }
    );
    prevSelectedState.current = null;
  }
};

export interface BuildHandleClickParams {
  map: MapLibreMap;
  layerId: string;
  sourceByLayerId: Map<string, string>;
  setClick: React.Dispatch<React.SetStateAction<MapClickInfo | null>>;
  /** Tracks the last feature whose selected state was set so it can be cleared on deselect. */
  prevSelectedState: PrevFeatureState;
  /** Layer IDs that have `selectedPaint` declared; drives `setFeatureState({ selected })`. */
  selectedPaintLayerIds: Set<string>;
}

/**
 * Builds the per-layer click handler that reads the clicked feature's
 * `feature-state` and calls `setClick` with the resulting {@link MapClickInfo}.
 * Extracted at module scope (mirrors `buildHandleMove`) so `useMapClick`
 * stays under the `max-lines-per-function` threshold.
 */
export const buildHandleClick = ({
  map,
  layerId,
  sourceByLayerId,
  setClick,
  prevSelectedState,
  selectedPaintLayerIds,
}: BuildHandleClickParams) => {
  return (event: MapLayerMouseEvent) => {
    const feature = event.features?.[0];
    if (!feature || feature.id == null) {
      clearSelected(map, prevSelectedState);
      setClick(null);
      return;
    }
    const resolvedLayerId = feature.layer?.id ?? layerId;
    const sourceId = sourceByLayerId.get(resolvedLayerId);
    if (!sourceId) {
      clearSelected(map, prevSelectedState);
      setClick(null);
      return;
    }

    // Swap selected feature-state: clear previous, mark new.
    clearSelected(map, prevSelectedState);
    if (selectedPaintLayerIds.has(resolvedLayerId)) {
      map.setFeatureState(
        { source: sourceId, id: feature.id },
        { selected: true }
      );
      prevSelectedState.current = { sourceId, id: feature.id };
    }

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
    map.getCanvas().style.cursor = 'pointer';
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
    map.getCanvas().style.cursor = 'pointer';
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

export interface DecodedClickTracking {
  tracked: TrackedClickEntry[];
  sourceByLayerId: Map<string, string>;
  selectedPaintLayerIds: Set<string>;
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
  const selectedPaintLayerIds = new Set(
    tracked
      .filter((t) => {
        return t.hasSelectedPaint;
      })
      .map((t) => {
        return t.layerId;
      })
  );
  return { tracked, sourceByLayerId, selectedPaintLayerIds };
};
