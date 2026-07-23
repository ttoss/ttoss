import type {
  Map as MapLibreMap,
  Marker as MapLibreMarker,
  MarkerOptions as MapLibreMarkerOptions,
} from 'maplibre-gl';
import * as React from 'react';

import type { GeoVisRuntime } from '../runtime/createRuntime';
import type { VisualizationSpec } from '../spec/types';
import type { MapClickInfo, MapHoverInfo } from './contexts';
import { useGeoVis } from './contexts';
import {
  buildHandleGlobalCursor,
  buildHandleMove,
  buildHandleWindowFocus,
  buildHoverTrackedKey,
  buildHoverTracking,
  buildPointerLayerIds,
  clearHover,
  type DecodedHoverTracking,
  type PrevFeatureState,
  TRACKED_FIELD_SEP,
  TRACKED_RECORD_SEP,
} from './hooks.builders';
import {
  attachClickDismissListeners,
  buildClickTracking,
  buildHandleClick,
  dispatchClearSelection,
} from './hooks.builders.click';

export type { MapClickInfo, MapHoverInfo } from './contexts';

interface UseMapHoverParams {
  runtime: GeoVisRuntime | null;
  spec: VisualizationSpec;
}

// Reused when no polygon hover layers are present (pointer-only mode).
// All fields are read-only at runtime so sharing across hook instances is safe.
const EMPTY_HOVER_TRACKING: DecodedHoverTracking = {
  tracked: [],
  sourceByLayerId: new Map<string, string>(),
  hoverPaintLayerIds: new Set<string>(),
  trackedLayerIds: [],
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

  // Encoded as a string key so the effect's dependency array stays stable when
  // the spec object reference changes but the relevant subset does not.
  // Depends on `spec.layers` (not the whole `spec`) so high-frequency spec
  // updates such as `mapData` patches do NOT detach/reattach the handlers.
  const trackedKey = React.useMemo(() => {
    return buildHoverTrackedKey(spec.layers);
  }, [spec.layers]);

  const pointerLayerIds = React.useMemo(() => {
    return buildPointerLayerIds(spec.layers);
  }, [spec.layers]);

  React.useEffect(() => {
    if (!runtime || (!trackedKey && pointerLayerIds.size === 0)) return;

    const map = runtime.getAdapter().getNativeInstance() as MapLibreMap | null;
    if (!map) return;

    const { tracked, sourceByLayerId, hoverPaintLayerIds, trackedLayerIds } =
      trackedKey ? buildHoverTracking(trackedKey) : EMPTY_HOVER_TRACKING;
    const prevHoveredState: PrevFeatureState = { current: null };
    // Shared flag: set by the global handler (fires first) so polygon handlers
    // (fire after) skip their setHover call when the cursor is over a point layer.
    const pointHovering = { current: false };

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
          pointHovering,
        }),
      };
    });

    // Do NOT clear lastPointRef here: some browsers fire a synthetic
    // `mouseleave` on alt-tab; the window-focus recheck restores the tooltip.
    const handleLeave = () => {
      return clearHover(map, setHover, prevHoveredState);
    };

    const handleGlobalCursor = buildHandleGlobalCursor({
      map,
      pointerLayerIds,
      trackedLayerIds,
      setHover,
      pointHovering,
    });
    map.on('mousemove', handleGlobalCursor);

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
  }, [runtime, trackedKey, pointerLayerIds]);

  return hover;
};

interface UseMapClickParams {
  runtime: GeoVisRuntime | null;
  spec: VisualizationSpec;
}

export interface UseMapClickResult {
  /** The last clicked {@link MapClickInfo}, or `null` when no feature is selected. */
  click: MapClickInfo | null;
  /**
   * Clears the click selection the same way Escape/outside-click already do
   * (feature-state included) — a stable reference across renders, safe to
   * call even before the effect below has attached (a no-op then).
   */
  dismiss: () => void;
}

const noopDismiss = () => {};

/**
 * Tracks the last clicked feature on every layer (any geometry type) that has
 * an `activeLegendId` declared. Supports point, line, polygon, symbol, and
 * heatmap geometries — the geometry filter is intentionally absent so
 * consumers can wire click-to-center (or any click reaction) on any layer.
 */
export const useMapClick = ({
  runtime,
  spec,
}: UseMapClickParams): UseMapClickResult => {
  const [click, setClick] = React.useState<MapClickInfo | null>(null);
  // Holds the effect's own dismiss closure so the returned `dismiss` can stay
  // a stable reference across renders while still reaching the current map
  // instance and prevSelectedState — updated on every effect run, read only
  // from the `dismiss` callback below (an event handler, not render).
  const dismissImplRef = React.useRef<() => void>(noopDismiss);

  const trackedKey = React.useMemo(() => {
    return spec.layers
      .filter((layer) => {
        return (
          // All geometry types are supported for click interactions, so we only check for the presence of `activeLegendId`, `selectedPaint`, or `click.onSelect` to determine whether the layer should be tracked.
          layer.activeLegendId != null ||
          layer.selectedPaint != null ||
          layer.clickAnchor != null ||
          layer.click?.onSelect != null
        );
      })
      .map((layer) => {
        const needsSelectedState =
          layer.selectedPaint != null || layer.clickAnchor?.iconImage != null;
        const latKey = layer.clickAnchor?.latKey ?? '';
        const lngKey = layer.clickAnchor?.lngKey ?? '';
        return `${layer.id}${TRACKED_FIELD_SEP}${layer.sourceId}${TRACKED_FIELD_SEP}${needsSelectedState ? '1' : '0'}${TRACKED_FIELD_SEP}${latKey}${TRACKED_FIELD_SEP}${lngKey}`;
      })
      .join(TRACKED_RECORD_SEP);
  }, [spec.layers]);

  React.useEffect(() => {
    if (!runtime) return;
    if (!trackedKey) return;

    const map = runtime.getAdapter().getNativeInstance() as MapLibreMap | null;
    if (!map) return;

    const { tracked, sourceByLayerId } = buildClickTracking(trackedKey);

    const dismissSelection = () => {
      dispatchClearSelection(runtime);
      setClick(null);
    };
    dismissImplRef.current = dismissSelection;

    const handlers = tracked.map(({ layerId, latKey, lngKey }) => {
      return {
        layerId,
        handleClick: buildHandleClick({
          map,
          layerId,
          sourceByLayerId,
          setClick,
          runtime,
          latKey,
          lngKey,
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
    const detachDismissListeners = attachClickDismissListeners({
      map,
      trackedLayerIds,
      dismissSelection,
    });

    return () => {
      for (const { layerId, handleClick } of handlers) {
        map.off('click', layerId, handleClick);
      }
      detachDismissListeners();
      dismissImplRef.current = noopDismiss;
      dismissSelection();
    };
  }, [runtime, trackedKey]);

  const dismiss = React.useCallback(() => {
    dismissImplRef.current();
  }, []);

  return { click, dismiss };
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
        .setLngLat(click.featureLngLat ?? click.lngLat)
        .addTo(map);
    })();

    return () => {
      cancelled = true;
      if (marker) marker.remove();
    };
  }, [runtime, click, spec.layers]);
};

interface UseClickSelectParams {
  spec: VisualizationSpec;
  click: MapClickInfo | null;
}

/**
 * Invokes the spec-driven `layer.click.onSelect` callback whenever the click
 * selection changes. Mirrors {@link useClickAnchor}: the reaction is declared on
 * the layer in the spec, so consumers do not read `useGeoVisClick()` in a child
 * of the provider.
 *
 * On selection, calls the clicked layer's `onSelect(info)`. On clear
 * (`click === null` — Escape or a click outside every tracked layer), calls
 * `onSelect(null)` once on the layer that last held a selection, matching the
 * "clears to null" semantics of `GeoVisClickContext`.
 *
 * A `lastNotified` ref gates the effect on the click *selection* changing, so
 * unrelated spec updates (e.g. high-frequency `mapData` patches) that keep the
 * same click do not re-fire `onSelect`.
 */
export const useClickSelect = ({ spec, click }: UseClickSelectParams): void => {
  const lastNotifiedRef = React.useRef<MapClickInfo | null>(null);
  const lastLayerIdRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (click === lastNotifiedRef.current) return;
    lastNotifiedRef.current = click;

    if (click) {
      lastLayerIdRef.current = click.layerId;
      const layer = spec.layers.find((l) => {
        return l.id === click.layerId;
      });
      layer?.click?.onSelect?.(click);
      return;
    }

    const lastLayerId = lastLayerIdRef.current;
    if (lastLayerId === null) return;
    lastLayerIdRef.current = null;
    const layer = spec.layers.find((l) => {
      return l.id === lastLayerId;
    });
    layer?.click?.onSelect?.(null);
  }, [click, spec]);
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
