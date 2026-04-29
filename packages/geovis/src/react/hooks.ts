import type { Map as MapLibreMap, MapMouseEvent } from 'maplibre-gl';
import * as React from 'react';

import type { GeoVisRuntime } from '../runtime/createRuntime';
import type { VisualizationSpec } from '../spec/types';
import { useGeoVis } from './GeoVisProvider';

/**
 * Snapshot of a feature currently hovered on the map. Coordinates are pixel
 * offsets relative to the map canvas, so consumers can render overlays inside
 * the same `position: relative` container that hosts `<GeoVisCanvas>`.
 */
export interface MapHoverInfo {
  /** Layer id under the cursor. */
  layerId: string;
  /** Source id backing the layer (kept so consumers can re-query feature-state). */
  sourceId: string;
  /** Hovered feature's id (typically `geometryId` from `mapData`). */
  featureId: string | number;
  /** `feature-state.value` (set by `mapData`); `null` when the feature has no value bound. */
  value: number | null;
  /** Pixel coordinates relative to the map canvas. */
  point: { x: number; y: number };
}

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
  const trackedKey = React.useMemo(() => {
    return spec.layers
      .filter((layer) => {
        return layer.geometry === 'polygon' && layer.activeLegendId != null;
      })
      .map((layer) => {
        return `${layer.id}${TRACKED_FIELD_SEP}${layer.sourceId}`;
      })
      .join(TRACKED_RECORD_SEP);
  }, [spec]);

  React.useEffect(() => {
    if (!runtime) return;
    if (!trackedKey) return;

    const map = runtime.getAdapter().getNativeInstance() as MapLibreMap | null;
    if (!map) return;

    const tracked = trackedKey.split(TRACKED_RECORD_SEP).map((entry) => {
      const [layerId, sourceId] = entry.split(TRACKED_FIELD_SEP);
      return { layerId, sourceId };
    });
    const layerIds = tracked.map((t) => {
      return t.layerId;
    });
    const sourceByLayerId = new Map(
      tracked.map((t) => {
        return [t.layerId, t.sourceId] as const;
      })
    );

    const handleMove = (event: MapMouseEvent) => {
      const features = map.queryRenderedFeatures(event.point, {
        layers: layerIds,
      });
      const feature = features[0];
      if (!feature || feature.id == null || !feature.layer) {
        map.getCanvas().style.cursor = '';
        setHover(null);
        return;
      }
      const sourceId = sourceByLayerId.get(feature.layer.id);
      if (!sourceId) return;

      const state = map.getFeatureState({
        source: sourceId,
        id: feature.id,
      }) as { value?: unknown };
      const value =
        typeof state.value === 'number' && Number.isFinite(state.value)
          ? state.value
          : null;

      map.getCanvas().style.cursor = 'pointer';
      setHover({
        layerId: feature.layer.id,
        sourceId,
        featureId: feature.id,
        value,
        point: { x: event.point.x, y: event.point.y },
      });
    };

    const handleLeave = () => {
      map.getCanvas().style.cursor = '';
      setHover(null);
    };

    for (const id of layerIds) {
      map.on('mousemove', id, handleMove);
      map.on('mouseleave', id, handleLeave);
    }

    return () => {
      for (const id of layerIds) {
        map.off('mousemove', id, handleMove);
        map.off('mouseleave', id, handleLeave);
      }
      map.getCanvas().style.cursor = '';
      setHover(null);
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
