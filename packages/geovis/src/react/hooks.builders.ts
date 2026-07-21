import type { Map as MapLibreMap, MapLayerMouseEvent } from 'maplibre-gl';
import type * as React from 'react';

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
  /** Whether this layer needs `selected` feature-state (has selectedPaint or clickAnchor.iconImage). */
  needsSelectedState: boolean;
}

/**
 * Builds the per-layer click handler that reads the clicked feature's
 * `feature-state` and calls `setClick` with the resulting {@link MapClickInfo}.
 * Extracted at module scope (mirrors `buildHandleMove`) so `useMapClick`
 * stays under the `max-lines-per-function` threshold.
 *
 * Only sets `selected: true` feature-state when `needsSelectedState` is true
 * (layer has `selectedPaint` or `clickAnchor.iconImage`). Layers tracked only
 * for `activeLegendId` will not receive selected state, avoiding unintended
 * side effects on consumer expressions that use `feature-state.selected`.
 */
export const buildHandleClick = ({
  map,
  layerId,
  sourceByLayerId,
  setClick,
  prevSelectedState,
  needsSelectedState,
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
    // Only set selected state when the layer has visual feedback (selectedPaint or clickAnchor.iconImage).
    clearSelected(map, prevSelectedState);
    if (needsSelectedState) {
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
  /**
   * Shared ref set by `buildHandleGlobalCursor` (which runs first) to signal
   * that the cursor is currently over a pointer/click layer. When `true` this
   * handler returns early so the point-layer hover is not overwritten by a
   * polygon layer's `mousemove` event that fires immediately after.
   */
  pointHovering: { current: boolean };
}

export const buildHandleMove = ({
  map,
  layerId,
  sourceByLayerId,
  setHover,
  lastPointRef,
  prevHoveredState,
  hoverPaintLayerIds,
  pointHovering,
}: BuildHandleMoveParams) => {
  return (event: MapLayerMouseEvent) => {
    // The global mousemove handler (buildHandleGlobalCursor) fires before
    // layer-scoped events and sets this flag when the cursor is over a pointer
    // layer. Skip polygon hover update so the point tooltip takes priority.
    if (pointHovering.current) return;
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
    const resolvedLayerId = feature.layer ? feature.layer.id : layerId;
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
  /** Polygon hover-tracked layer IDs; used to avoid clearing hover when the cursor moves onto a polygon. */
  trackedLayerIds: string[];
  setHover: React.Dispatch<React.SetStateAction<MapHoverInfo | null>>;
  /**
   * Shared ref written here (global fires first) and read by `buildHandleMove`
   * (layer-scoped fires after). Set to `true` while the cursor is over a pointer
   * layer so the polygon handler skips its own `setHover` call.
   */
  pointHovering: { current: boolean };
}

/**
 * Builds the global (non-layer-scoped) `mousemove` handler that controls the
 * map canvas cursor and drives hover-tooltip state for click/point layers.
 *
 * Because MapLibre dispatches map-level `mousemove` before layer-scoped events,
 * this handler runs first. It writes `pointHovering.current` so the polygon
 * handlers that fire immediately after know whether to skip their `setHover`
 * call — preventing the polygon tooltip from overwriting the point tooltip.
 *
 * Uses `feature.source` (the MapLibre-native source ID) rather than a spec
 * lookup, so the sourceId is always correct regardless of layer ID suffixes.
 */
export const buildHandleGlobalCursor = ({
  map,
  pointerLayerIds,
  trackedLayerIds,
  setHover,
  pointHovering,
}: BuildHandleGlobalCursorParams) => {
  return (event: { point: { x: number; y: number } }) => {
    const hits =
      pointerLayerIds.size > 0
        ? map.queryRenderedFeatures(
            [event.point.x, event.point.y] as [number, number],
            { layers: [...pointerLayerIds] }
          )
        : [];
    if (hits.length > 0) {
      map.getCanvas().style.cursor = 'pointer';
      const feature = hits[0];
      const rect = map.getCanvas().getBoundingClientRect();
      setHover({
        layerId: feature.layer.id,
        sourceId: feature.source,
        featureId: feature.id ?? '',
        value: null,
        point: { x: rect.left + event.point.x, y: rect.top + event.point.y },
      });
      pointHovering.current = true;
    } else {
      map.getCanvas().style.cursor = 'default';
      if (pointHovering.current) {
        pointHovering.current = false;
        const polygonHits =
          trackedLayerIds.length > 0
            ? map.queryRenderedFeatures(
                [event.point.x, event.point.y] as [number, number],
                { layers: trackedLayerIds }
              )
            : [];
        if (polygonHits.length === 0) setHover(null);
      }
    }
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
