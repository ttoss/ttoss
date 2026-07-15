import type {
  Map as MapLibreMap,
  MapMouseEvent,
  Marker as MapLibreMarker,
  MarkerOptions as MapLibreMarkerOptions,
} from 'maplibre-gl';
import * as React from 'react';

import type { GeoVisRuntime } from '../runtime/createRuntime';
import type { VisualizationSpec } from '../spec/types';
import type { MapClickInfo, MapHoverInfo } from './contexts';
import { useGeoVis } from './contexts';
import {
  buildClickTracking,
  buildHandleClick,
  buildHandleMove,
  buildHandleWindowFocus,
  buildHoverTracking,
  clearHover,
  dispatchClearSelection,
  type PrevFeatureState,
  TRACKED_FIELD_SEP,
  TRACKED_RECORD_SEP,
} from './hooks.builders';

export type { MapClickInfo, MapHoverInfo } from './contexts';

interface UseMapHoverParams {
  runtime: GeoVisRuntime | null;
  spec: VisualizationSpec;
}

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
        // Only polygon layers can have hoverPaint and/or activeLegendId, so we can skip non-polygons entirely. This also avoids attaching hover handlers to
        // non-polygon layers that have active legends (e.g. symbol layers with
        // `icon-image` driven by an active legend) but do not support hoverPaint.
        return (
          layer.geometry === 'polygon' &&
          (layer.activeLegendId != null || layer.hoverPaint != null)
        );
      })
      .map((layer) => {
        return `${layer.id}${TRACKED_FIELD_SEP}${layer.sourceId}${TRACKED_FIELD_SEP}${layer.hoverPaint ? '1' : '0'}`;
      })
      .join(TRACKED_RECORD_SEP);
  }, [spec.layers]);

  React.useEffect(() => {
    if (!runtime) return;
    if (!trackedKey) return;

    const map = runtime.getAdapter().getNativeInstance() as MapLibreMap | null;
    if (!map) return;

    const { tracked, sourceByLayerId, hoverPaintLayerIds, trackedLayerIds } =
      buildHoverTracking(trackedKey);
    const prevHoveredState: PrevFeatureState = { current: null };

    const handlers = tracked.map(({ layerId }) => {
      return {
        layerId,
        handleMove: buildHandleMove({
          map,
          layerId,
          sourceByLayerId,
          setHover,
          lastPointRef,
          prevHoveredState,
          hoverPaintLayerIds,
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
      clearHover(map, setHover, prevHoveredState);
    };

    const handleWindowFocus = buildHandleWindowFocus({
      map,
      trackedLayerIds,
      sourceByLayerId,
      lastPointRef,
      setHover,
      prevHoveredState,
      hoverPaintLayerIds,
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
      clearHover(map, setHover, prevHoveredState);
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
        return (
          // All geometry types are supported for click interactions, so we only check for the presence of `activeLegendId` or `selectedPaint` to determine whether the layer should be tracked.
          layer.activeLegendId != null ||
          layer.selectedPaint != null ||
          layer.clickAnchor != null
        );
      })
      .map((layer) => {
        const needsSelectedState =
          layer.selectedPaint != null || layer.clickAnchor?.iconImage != null;
        return `${layer.id}${TRACKED_FIELD_SEP}${layer.sourceId}${TRACKED_FIELD_SEP}${needsSelectedState ? '1' : '0'}`;
      })
      .join(TRACKED_RECORD_SEP);
  }, [spec.layers]);

  React.useEffect(() => {
    if (!runtime) return;
    if (!trackedKey) return;

    const map = runtime.getAdapter().getNativeInstance() as MapLibreMap | null;
    if (!map) return;

    const { tracked, sourceByLayerId } = buildClickTracking(trackedKey);

    const handlers = tracked.map(({ layerId }) => {
      return {
        layerId,
        handleClick: buildHandleClick({
          map,
          layerId,
          sourceByLayerId,
          setClick,
          runtime,
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
      if (!hits || hits.length === 0) {
        dispatchClearSelection(runtime);
        setClick(null);
      }
    };
    map.on('click', handleOutsideClick);

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dispatchClearSelection(runtime);
        setClick(null);
      }
    };
    window.addEventListener('keydown', handleEscape);

    return () => {
      for (const { layerId, handleClick } of handlers) {
        map.off('click', layerId, handleClick);
      }
      map.off('click', handleOutsideClick);
      window.removeEventListener('keydown', handleEscape);
      dispatchClearSelection(runtime);
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
interface UseClickAnchorParams {
  runtime: GeoVisRuntime | null;
  spec: VisualizationSpec;
  click: MapClickInfo | null;
}

/**
 * Manages the lifecycle of a spec-driven `maplibregl.Marker` for click anchors.
 * Called from `ClickProvider` where the live `click` snapshot is available.
 *
 * DOM Marker is created when the clicked layer's `clickAnchor` resolves to DOM
 * rendering: `element` present, OR `color` present, OR neither `iconImage` nor
 * `element` is set (default pin). When `iconImage` is set without `element`,
 * only the companion symbol layer (managed by `syncSourcesAndLayers`) is used
 * and no DOM Marker is added.
 */
type ClickAnchorSpec = NonNullable<
  VisualizationSpec['layers'][number]['clickAnchor']
>;

const buildMarkerOptions = (anchor: ClickAnchorSpec): MapLibreMarkerOptions => {
  const opts: MapLibreMarkerOptions = {};
  if (anchor.color) opts.color = anchor.color;
  if (anchor.offset) opts.offset = anchor.offset;
  return opts;
};

export const useClickAnchor = ({
  runtime,
  spec,
  click,
}: UseClickAnchorParams): void => {
  React.useEffect(() => {
    if (!runtime || !click) return;

    const layer = spec.layers.find((l) => {
      return l.id === click.layerId;
    });
    const anchor = layer?.clickAnchor;
    if (!anchor) return;

    // DOM Marker: created when `iconImage` is absent.
    // `{ iconImage }` alone → symbol layer only (handled by syncSourcesAndLayers).
    const hasDomMarker = !anchor.iconImage;
    if (!hasDomMarker) return;

    const map = runtime.getAdapter().getNativeInstance() as MapLibreMap | null;
    if (!map) return;

    let cancelled = false;
    let marker: MapLibreMarker | null = null;

    (async () => {
      const { default: maplibregl } = await import('maplibre-gl');
      if (cancelled) return;

      marker = new maplibregl.Marker(buildMarkerOptions(anchor))
        .setLngLat(click.lngLat)
        .addTo(map);
    })();

    return () => {
      cancelled = true;
      if (marker) marker.remove();
    };
  }, [runtime, click, spec.layers]);
};

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
