import type maplibregl from 'maplibre-gl';

import { coerceGeometryId } from '../../spec/mapDataPatch';
import type { MapData, MapDataRow, VisualizationSpec } from '../../spec/types';

/**
 * Tracks pending `sourcedata` listeners keyed by `mapDataId` per map instance.
 * Allows cancellation of stale listeners when a `mapData` entry is removed or
 * replaced before its source finishes loading.
 */
const pendingListeners = new WeakMap<
  maplibregl.Map,
  Map<string, (e: maplibregl.MapSourceDataEvent) => void>
>();

/** Cancels a pending sourcedata listener for `mapDataId` on `map`, if one exists. */
const cancelPendingListener = (
  map: maplibregl.Map,
  mapDataId: string
): void => {
  const byId = pendingListeners.get(map);
  const listener = byId?.get(mapDataId);
  if (!byId || !listener) return;
  map.off('sourcedata', listener);
  byId.delete(mapDataId);
};

/**
 * Applies one MapData entry to a MapLibre source via setFeatureState.
 *
 * Feature state is set directly by `geometryId`, which is the feature id in
 * both supported configurations:
 * - When `joinKey` is omitted, `geometryId` matches the source's native
 *   `feature.id`.
 * - When `joinKey` is set, the adapter promotes that property to `feature.id`
 *   (see `resolvePromoteIdForSource`), so the join value *is* the feature id.
 *
 * Because state is keyed by id (not resolved via `querySourceFeatures`),
 * MapLibre applies it lazily per tile — features outside the current viewport
 * are colored as soon as their tile loads, instead of only the ones loaded when
 * this runs. The source need not even be loaded yet.
 */
/** Sanitizes non-finite numeric values to 0 for MapLibre expressions. */
const sanitizeValue = (value: MapDataRow['value']): MapDataRow['value'] => {
  return typeof value === 'number' && !Number.isFinite(value) ? 0 : value;
};

export const applyMapDataToSource = (
  map: maplibregl.Map,
  mapData: MapData
): void => {
  if (!map.getSource(mapData.mapId)) return;

  const stateKey = mapData.stateKey ?? 'value';

  const applyRow = (featureId: string | number, row: MapDataRow) => {
    map.setFeatureState(
      { source: mapData.mapId, id: featureId },
      { [stateKey]: sanitizeValue(row.value) }
    );
  };

  for (const row of mapData.data) {
    applyRow(coerceGeometryId(row.geometryId), row);
  }
};

/**
 * Schedules `applyMapDataToSource` to run as soon as the underlying source
 * is loaded. If already loaded, runs synchronously. Otherwise registers a
 * `sourcedata` listener and tracks it so it can be cancelled if the entry
 * is removed or replaced before the source finishes loading.
 */
export const scheduleMapDataApply = (
  map: maplibregl.Map,
  mapData: MapData
): void => {
  if (map.isSourceLoaded(mapData.mapId)) {
    applyMapDataToSource(map, mapData);
    return;
  }
  // Cancel any previously registered listener for the same mapDataId to avoid
  // applying stale feature state if this entry was replaced before load.
  cancelPendingListener(map, mapData.mapDataId);
  const listener = (e: maplibregl.MapSourceDataEvent) => {
    if (e.sourceId !== mapData.mapId || !e.isSourceLoaded) return;
    applyMapDataToSource(map, mapData);
    map.off('sourcedata', listener);
    pendingListeners.get(map)?.delete(mapData.mapDataId);
  };
  if (!pendingListeners.has(map)) pendingListeners.set(map, new Map());
  pendingListeners.get(map)!.set(mapData.mapDataId, listener);
  map.on('sourcedata', listener);
};

/**
 * Removes all feature state set by a `MapData` entry from its source.
 * Also cancels any pending `sourcedata` listener registered by
 * `scheduleMapDataApply` for the same `mapDataId` so a late source-load
 * cannot reapply data that no longer belongs to the current spec.
 *
 * Removes directly by `row.geometryId` — the feature id in both configurations
 * (native id, or the `joinKey` property promoted to `feature.id`). Like
 * `applyMapDataToSource`, this is keyed by id rather than resolved via
 * `querySourceFeatures`, so it works regardless of which features are currently
 * loaded in the viewport. Silently returns when the source does not exist.
 */
export const removeMapDataFromSource = (
  map: maplibregl.Map,
  mapData: MapData
): void => {
  // Cancel a pending apply first: even if the source no longer exists, the
  // listener would otherwise stay registered on the map until the entry is
  // explicitly cancelled.
  cancelPendingListener(map, mapData.mapDataId);

  if (!map.getSource(mapData.mapId)) return;

  const stateKey = mapData.stateKey ?? 'value';

  for (const row of mapData.data) {
    map.removeFeatureState(
      { source: mapData.mapId, id: coerceGeometryId(row.geometryId) },
      stateKey
    );
  }
};

/**
 * Compares two `MapData` entries by the fields that affect feature-state
 * behaviour. Reference changes to `title`, `description`, or `dimension` that
 * leave feature-state data unchanged will correctly return `true` here,
 * avoiding unnecessary `setFeatureState`/`removeFeatureState` calls when only
 * paint properties changed on the spec.
 *
 * Compares:
 * - `mapId` — different source → different feature-state target
 * - `stateKey` — different key → different feature-state property name
 * - `data` content — different values → need to reapply
 */
export const mapDataEntriesEqual = (a: MapData, b: MapData): boolean => {
  if (a.mapId !== b.mapId) return false;
  if ((a.stateKey ?? 'value') !== (b.stateKey ?? 'value')) return false;
  if (a.data.length !== b.data.length) return false;
  return a.data.every((row, i) => {
    const other = b.data[i];
    return row.geometryId === other.geometryId && row.value === other.value;
  });
};

/**
 * Re-applies every entry in `spec.mapData` to its source.
 * Used after style/source rebuilds where feature state is lost.
 */
export const reapplyAllMapData = (
  map: maplibregl.Map,
  spec: VisualizationSpec
): void => {
  for (const md of spec.mapData ?? []) scheduleMapDataApply(map, md);
};

/** Applies a single-row value update to the map via `setFeatureState`. */
const applyRowReplacement = (
  map: maplibregl.Map,
  mapData: MapData,
  geometryId: string,
  value: MapDataRow['value']
): void => {
  const stateKey = mapData.stateKey ?? 'value';

  // `geometryId` is the feature id in both configurations (native id, or the
  // `joinKey` property promoted to `feature.id`). Resolve the original
  // geometryId type from the stored row so numeric feature ids (e.g. 1) are not
  // coerced to strings ('1'), which would cause setFeatureState to miss the
  // intended feature.
  const row = mapData.data.find((r) => {
    return String(r.geometryId) === geometryId;
  });
  const featureId = row?.geometryId ?? coerceGeometryId(geometryId);
  map.setFeatureState(
    { source: mapData.mapId, id: featureId },
    { [stateKey]: sanitizeValue(value) }
  );
};

/** Handles a replace patch on the live map: full-entry or single-row granularity based on path depth. */
const handleMapDataReplace = (
  map: maplibregl.Map,
  currentMapData: ReadonlyArray<MapData>,
  patch: { path?: string; value?: unknown }
): void => {
  if (!patch.path) return;
  const parts = patch.path.split('.');
  if (parts.length < 2 || parts[0] !== 'mapData') return;
  const target = currentMapData.find((md) => {
    return md.mapDataId === parts[1];
  });
  if (!target) return;
  if (parts.length === 2 && patch.value != null) {
    removeMapDataFromSource(map, target);
    scheduleMapDataApply(map, patch.value as MapData);
    return;
  }
  if (parts.length === 4 && parts[2] === 'data') {
    applyRowReplacement(
      map,
      target,
      parts[3],
      patch.value as MapDataRow['value']
    );
  }
};

/**
 * Applies the side effects of a mapData patch to the live MapLibre map.
 * Spec-level state mutation is the caller's responsibility (see
 * `applyMapDataPatchToSpec`).
 */
export const applyMapDataPatchToMap = (
  map: maplibregl.Map,
  currentMapData: ReadonlyArray<MapData>,
  patch: { op: 'add' | 'remove' | 'replace'; path?: string; value?: unknown }
): void => {
  if (patch.op === 'add' && patch.value != null) {
    scheduleMapDataApply(map, patch.value as MapData);
    return;
  }
  if (patch.op === 'remove') {
    const mapDataId = patch.value as string;
    cancelPendingListener(map, mapDataId);
    const target = currentMapData.find((md) => {
      return md.mapDataId === mapDataId;
    });
    if (target) removeMapDataFromSource(map, target);
    return;
  }
  if (patch.op === 'replace') {
    handleMapDataReplace(map, currentMapData, patch);
  }
};
