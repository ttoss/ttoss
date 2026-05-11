import type { Map as MapLibreMap, MapMouseEvent } from 'maplibre-gl';
import * as React from 'react';

import type { GeoVisRuntime } from '../runtime/createRuntime';
import type { VisualizationSpec } from '../spec/types';
import type { MapHoverInfo } from './contexts';
import { useGeoVis } from './contexts';

export type { MapHoverInfo } from './contexts';

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
}

/**
 * MapLibre fills `event.features` with features hit on the *delegated* layer
 * for layer-bound handlers. Typed locally because `MapMouseEvent` does not
 * expose this field in `@types/maplibre-gl` even though it is documented.
 */
type DelegatedMouseEvent = MapMouseEvent & {
  features?: ReadonlyArray<{ id?: string | number; layer?: { id: string } }>;
};

const clearHover = (
  map: MapLibreMap,
  setHover: React.Dispatch<React.SetStateAction<MapHoverInfo | null>>
) => {
  map.getCanvas().style.cursor = '';
  setHover(null);
};

const buildHandleMove = ({
  map,
  layerId,
  sourceByLayerId,
  setHover,
}: BuildHandleMoveParams) => {
  return (event: MapMouseEvent) => {
    // Prefer the delegated `features` payload (already scoped to `layerId`)
    // to avoid an extra `queryRenderedFeatures` call on every mousemove and
    // to disambiguate when multiple tracked layers overlap at the cursor.
    const delegatedFeature = (event as DelegatedMouseEvent).features?.[0];
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
    const handlers = tracked.map(({ layerId }) => {
      return {
        layerId,
        handleMove: buildHandleMove({
          map,
          layerId,
          sourceByLayerId,
          setHover,
        }),
      };
    });

    const handleLeave = () => {
      clearHover(map, setHover);
    };

    for (const { layerId, handleMove } of handlers) {
      map.on('mousemove', layerId, handleMove);
      map.on('mouseleave', layerId, handleLeave);
    }

    return () => {
      for (const { layerId, handleMove } of handlers) {
        map.off('mousemove', layerId, handleMove);
        map.off('mouseleave', layerId, handleLeave);
      }
      clearHover(map, setHover);
    };
  }, [runtime, trackedKey]);

  return hover;
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
