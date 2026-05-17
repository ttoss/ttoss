import type {
  Map as MapLibreMap,
  MapLayerMouseEvent,
  MapMouseEvent,
} from 'maplibre-gl';
import * as React from 'react';

import type { GeoVisRuntime } from '../runtime/createRuntime';
import type { VisualizationSpec } from '../spec/types';
import type { MapClickInfo, MapHoverInfo } from './contexts';
import { useGeoVis } from './contexts';

export type { MapClickInfo, MapHoverInfo } from './contexts';

interface UseMapHoverParams {
  runtime: GeoVisRuntime | null;
  spec: VisualizationSpec;
}

// ASCII control characters chosen as internal separators so arbitrary
// characters in layer/source IDs (e.g. ':' in URL-based IDs) cannot corrupt
// the encode/decode roundtrip used to build `trackedKey`.
const TRACKED_FIELD_SEP = '\x1f'; // Unit Separator
const TRACKED_RECORD_SEP = '\x1e'; // Record Separator

/**
 * Normalises a `feature-state.value` read from MapLibre to the public
 * `MapHoverInfo.value` shape: numbers must be finite, strings pass through,
 * everything else collapses to `null`.
 */
const coerceFeatureStateValue = (raw: unknown): number | string | null => {
  if (typeof raw === 'number') {
    return Number.isFinite(raw) ? raw : null;
  }
  if (typeof raw === 'string') return raw;
  return null;
};

interface BuildHandleMoveParams {
  map: MapLibreMap;
  layerId: string;
  sourceByLayerId: Map<string, string>;
  setHover: React.Dispatch<React.SetStateAction<MapHoverInfo | null>>;
  /** Mutable ref updated on every valid mousemove; used by the window-focus recheck. */
  lastPointRef: React.MutableRefObject<{ x: number; y: number } | null>;
}

const clearHover = (
  map: MapLibreMap,
  setHover: React.Dispatch<React.SetStateAction<MapHoverInfo | null>>
) => {
  map.getCanvas().style.cursor = '';
  setHover(null);
};

interface BuildHandleClickParams {
  map: MapLibreMap;
  layerId: string;
  sourceByLayerId: Map<string, string>;
  setClick: React.Dispatch<React.SetStateAction<MapClickInfo | null>>;
}

/**
 * Builds the per-layer click handler that reads the clicked feature's
 * `feature-state` and calls `setClick` with the resulting {@link MapClickInfo}.
 * Extracted at module scope (mirrors `buildHandleMove`) so `useMapClick`
 * stays under the `max-lines-per-function` threshold.
 */
const buildHandleClick = ({
  map,
  layerId,
  sourceByLayerId,
  setClick,
}: BuildHandleClickParams) => {
  return (event: MapLayerMouseEvent) => {
    const feature = event.features?.[0];
    if (!feature || feature.id == null) {
      setClick(null);
      return;
    }
    const resolvedLayerId = feature.layer?.id ?? layerId;
    const sourceId = sourceByLayerId.get(resolvedLayerId);
    if (!sourceId) {
      setClick(null);
      return;
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

const buildHandleMove = ({
  map,
  layerId,
  sourceByLayerId,
  setHover,
  lastPointRef,
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
      clearHover(map, setHover);
      return;
    }
    const resolvedLayerId = feature.layer?.id ?? layerId;
    const sourceId = sourceByLayerId.get(resolvedLayerId);
    // Defensive: if the source mapping is missing for any reason, treat the
    // hover as cleared so the cursor/tooltip do not stay stuck on a stale
    // value from a previous valid hover.
    if (!sourceId) {
      clearHover(map, setHover);
      return;
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

interface BuildHandleWindowFocusParams {
  map: MapLibreMap;
  trackedLayerIds: string[];
  sourceByLayerId: Map<string, string>;
  lastPointRef: React.MutableRefObject<{ x: number; y: number } | null>;
  setHover: React.Dispatch<React.SetStateAction<MapHoverInfo | null>>;
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
const buildHandleWindowFocus = ({
  map,
  trackedLayerIds,
  sourceByLayerId,
  lastPointRef,
  setHover,
}: BuildHandleWindowFocusParams) => {
  return () => {
    const point = lastPointRef.current;
    if (!point) return;

    const hits = map.queryRenderedFeatures([point.x, point.y], {
      layers: trackedLayerIds,
    });
    const feature = hits[0];
    if (!feature || feature.id == null) {
      clearHover(map, setHover);
      return;
    }
    const resolvedLayerId = feature.layer?.id ?? trackedLayerIds[0];
    const sourceId = sourceByLayerId.get(resolvedLayerId);
    if (!sourceId) {
      clearHover(map, setHover);
      return;
    }
    const state = map.getFeatureState({
      source: sourceId,
      id: feature.id,
    }) as { value?: unknown };
    map.getCanvas().style.cursor = 'pointer';
    setHover({
      layerId: resolvedLayerId,
      sourceId,
      featureId: feature.id,
      value: coerceFeatureStateValue(state.value),
      point,
    });
  };
};

/**
 * Tracks the hovered feature on every polygon layer that has an `activeLegendId`
 * declared. The hook centralises the MapLibre `mousemove`/`mouseleave` wiring
 * so consumers can render hover-driven UI (`GeoVisHoverTooltip`, custom panels)
 * without touching the native map instance directly.
 *
 * Cursor feedback is also handled here: the canvas cursor switches to
 * `pointer` while a tracked feature is under the mouse and reverts on leave.
 */
export const useMapHover = ({
  runtime,
  spec,
}: UseMapHoverParams): MapHoverInfo | null => {
  const [hover, setHover] = React.useState<MapHoverInfo | null>(null);
  // Tracks the last cursor position reported by a valid mousemove so the
  // window-focus recheck can query the same point without a new mouse event.
  const lastPointRef = React.useRef<{ x: number; y: number } | null>(null);

  // Identify polygon layers that participate in legend-driven interactions.
  // Stored as a string key so the effect's dependency array stays stable when
  // the spec object reference changes but the relevant subset does not.
  // Depends on `spec.layers` (not the whole `spec`) so high-frequency spec
  // updates such as `mapData` patches do NOT detach/reattach the MapLibre
  // event handlers below.
  const trackedKey = React.useMemo(() => {
    return spec.layers
      .filter((layer) => {
        return layer.geometry === 'polygon' && layer.activeLegendId != null;
      })
      .map((layer) => {
        return `${layer.id}${TRACKED_FIELD_SEP}${layer.sourceId}`;
      })
      .join(TRACKED_RECORD_SEP);
  }, [spec.layers]);

  React.useEffect(() => {
    if (!runtime) return;
    if (!trackedKey) return;

    const map = runtime.getAdapter().getNativeInstance() as MapLibreMap | null;
    if (!map) return;

    const tracked = trackedKey.split(TRACKED_RECORD_SEP).map((entry) => {
      const [layerId, sourceId] = entry.split(TRACKED_FIELD_SEP);
      return { layerId, sourceId };
    });
    const sourceByLayerId = new Map(
      tracked.map((t) => {
        return [t.layerId, t.sourceId] as const;
      })
    );

    // One `mousemove` handler per layer so each handler can scope its
    // (fallback) `queryRenderedFeatures` call to its own layer and consume
    // `event.features` reliably (delegated payload is per-layer).
    const trackedLayerIds = tracked.map((t) => {
      return t.layerId;
    });

    const handlers = tracked.map(({ layerId }) => {
      return {
        layerId,
        handleMove: buildHandleMove({
          map,
          layerId,
          sourceByLayerId,
          setHover,
          lastPointRef,
        }),
      };
    });

    const handleLeave = () => {
      // Do NOT clear lastPointRef here. Some browsers (Windows/Linux) fire a
      // synthetic `mouseleave` when the user alt-tabs or switches windows.
      // Retaining the last known position lets the window-focus recheck call
      // `queryRenderedFeatures` on that point and restore the tooltip if the
      // cursor is genuinely still over a tracked feature. If the cursor has
      // moved away, `buildHandleWindowFocus` calls `clearHover` regardless.
      clearHover(map, setHover);
    };

    const handleWindowFocus = buildHandleWindowFocus({
      map,
      trackedLayerIds,
      sourceByLayerId,
      lastPointRef,
      setHover,
    });

    for (const { layerId, handleMove } of handlers) {
      map.on('mousemove', layerId, handleMove);
      map.on('mouseleave', layerId, handleLeave);
    }
    // Tab-switching fires `visibilitychange` (not `window.focus`), so we
    // reuse the same recheck logic via a thin wrapper that guards on the new
    // visibility state before delegating.
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleWindowFocus();
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      for (const { layerId, handleMove } of handlers) {
        map.off('mousemove', layerId, handleMove);
        map.off('mouseleave', layerId, handleLeave);
      }
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      lastPointRef.current = null;
      clearHover(map, setHover);
    };
  }, [runtime, trackedKey]);

  return hover;
};

interface UseMapClickParams {
  runtime: GeoVisRuntime | null;
  spec: VisualizationSpec;
}

/**
 * Tracks the last clicked feature on every layer (any geometry type) that has
 * an `activeLegendId` declared. Supports point, line, polygon, symbol, and
 * heatmap geometries — the geometry filter is intentionally absent so
 * consumers can wire click-to-center (or any click reaction) on any layer.
 *
 * @returns The last clicked {@link MapClickInfo}, or `null` when no feature
 * is selected.
 */
export const useMapClick = ({
  runtime,
  spec,
}: UseMapClickParams): MapClickInfo | null => {
  const [click, setClick] = React.useState<MapClickInfo | null>(null);

  const trackedKey = React.useMemo(() => {
    return spec.layers
      .filter((layer) => {
        return layer.activeLegendId != null;
      })
      .map((layer) => {
        return `${layer.id}${TRACKED_FIELD_SEP}${layer.sourceId}`;
      })
      .join(TRACKED_RECORD_SEP);
  }, [spec.layers]);

  React.useEffect(() => {
    if (!runtime) return;
    if (!trackedKey) return;

    const map = runtime.getAdapter().getNativeInstance() as MapLibreMap | null;
    if (!map) return;

    const tracked = trackedKey.split(TRACKED_RECORD_SEP).map((entry) => {
      const [layerId, sourceId] = entry.split(TRACKED_FIELD_SEP);
      return { layerId, sourceId };
    });
    const sourceByLayerId = new Map(
      tracked.map((t) => {
        return [t.layerId, t.sourceId] as const;
      })
    );

    const handlers = tracked.map(({ layerId }) => {
      return {
        layerId,
        handleClick: buildHandleClick({
          map,
          layerId,
          sourceByLayerId,
          setClick,
        }),
      };
    });

    for (const { layerId, handleClick } of handlers) {
      map.on('click', layerId, handleClick);
    }

    // Map-level handler: deselects when the user clicks on empty space.
    // `event.features` is NEVER populated for generic map.on('click') handlers
    // in MapLibre — only layer-bound handlers receive features. Instead, we use
    // queryRenderedFeatures to check whether any tracked layer was hit at the
    // clicked point, making this independent of event-dispatch order.
    const trackedLayerIds = tracked.map((t) => {
      return t.layerId;
    });
    const handleOutsideClick = (event: MapMouseEvent) => {
      const hits = map.queryRenderedFeatures(event.point, {
        layers: trackedLayerIds,
      });
      if (!hits || hits.length === 0) setClick(null);
    };
    map.on('click', handleOutsideClick);

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setClick(null);
    };
    window.addEventListener('keydown', handleEscape);

    return () => {
      for (const { layerId, handleClick } of handlers) {
        map.off('click', layerId, handleClick);
      }
      map.off('click', handleOutsideClick);
      window.removeEventListener('keydown', handleEscape);
      setClick(null);
    };
  }, [runtime, trackedKey]);

  return click;
};

export interface UseMapDataResult {
  mapDataId: string;
  mapId: string;
  joinKey?: string;
  /** Indexed lookup: stringified `geometryId` → `value`. */
  values: Map<string, number | string | null>;
  /** The `data` array as declared in the spec, in original order. */
  rows: ReadonlyArray<{
    geometryId: string | number;
    value: number | string | null;
  }>;
}

/**
 * Returns the indexed dataset entry for `mapDataId`, or `undefined` if
 * the spec has no matching `mapData[]` entry. Re-renders when the spec
 * changes (including via `applyPatch`).
 *
 * Must be used inside a {@link GeoVisProvider}.
 */
export const useMapData = (mapDataId: string): UseMapDataResult | undefined => {
  const { spec } = useGeoVis();
  return React.useMemo(() => {
    const md = spec.mapData?.find((entry) => {
      return entry.mapDataId === mapDataId;
    });
    if (!md) return undefined;
    const values = new Map<string, number | string | null>();
    for (const row of md.data) {
      values.set(String(row.geometryId), row.value);
    }
    return {
      mapDataId: md.mapDataId,
      mapId: md.mapId,
      joinKey: md.joinKey,
      values,
      rows: md.data,
    };
  }, [spec, mapDataId]);
};
