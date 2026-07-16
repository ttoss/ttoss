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
  buildHandleGlobalCursor,
  buildHandleMove,
  buildHandleWindowFocus,
  buildHoverTrackedKey,
  buildHoverTracking,
  buildPointerLayerIds,
  clearHover,
  clearSelected,
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

    const handleGlobalCursor = buildHandleGlobalCursor({
      map,
      pointerLayerIds,
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
      map.off('mousemove', handleGlobalCursor);
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
          // All geometry types are supported for click interactions, so we only check for the presence of `activeLegendId`, `selectedPaint`, `clickAnchor`, or a spec-driven `click` reaction to determine whether the layer should be tracked.
          layer.activeLegendId != null ||
          layer.selectedPaint != null ||
          layer.clickAnchor != null ||
          layer.click != null
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
    const prevSelectedState: PrevFeatureState = { current: null };

    const handlers = tracked.map(({ layerId, hasSelectedPaint }) => {
      return {
        layerId,
        handleClick: buildHandleClick({
          map,
          layerId,
          sourceByLayerId,
          setClick,
          prevSelectedState,
          needsSelectedState: hasSelectedPaint,
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
        clearSelected(map, prevSelectedState);
        setClick(null);
      }
    };
    map.on('click', handleOutsideClick);

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearSelected(map, prevSelectedState);
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
      clearSelected(map, prevSelectedState);
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

const darkenHex = (hex: string, amount: number): string => {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return hex;
  const num = parseInt(clean, 16);
  const r = Math.max(0, Math.round(((num >> 16) & 0xff) * (1 - amount)));
  const g = Math.max(0, Math.round(((num >> 8) & 0xff) * (1 - amount)));
  const b = Math.max(0, Math.round((num & 0xff) * (1 - amount)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
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

      const STYLE_ID = 'geovis-pin-drop-keyframes';
      if (!document.getElementById(STYLE_ID)) {
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `@keyframes geovis-pin-drop{0%{transform:translateY(-24px) scale(.7);opacity:0}70%{transform:translateY(4px) scale(1.05);opacity:1}85%{transform:translateY(-3px) scale(.98)}100%{transform:translateY(0) scale(1);opacity:1}}`;
        document.head.appendChild(style);
      }
      const svg = marker.getElement().firstElementChild as SVGElement | null;
      if (svg) {
        if (anchor.color) {
          const darkerColor = darkenHex(anchor.color, 0.3);
          const whiteFillGroup = svg.querySelector('g[fill="#FFFFFF"]');
          whiteFillGroup?.setAttribute('fill', darkerColor);
        }
        (svg as unknown as HTMLElement).style.animation =
          'geovis-pin-drop 0.35s cubic-bezier(0.34,1.56,0.64,1)';
      }
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
    // Only react when the selection itself changes, not on other spec updates.
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

    // Cleared: notify the layer that last held a selection, exactly once.
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
