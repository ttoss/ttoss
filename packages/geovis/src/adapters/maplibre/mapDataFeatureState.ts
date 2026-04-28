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

/** Builds a lookup index from join-key property value to MapLibre feature.id. */
const buildJoinKeyIndex = (
  features: ReturnType<maplibregl.Map['querySourceFeatures']>,
  joinKey: string
): Map<string, string | number> => {
  const index = new Map<string, string | number>();
  for (const f of features) {
    const k = f.properties?.[joinKey];
    if (k == null || f.id == null) continue;
    index.set(String(k), f.id as string | number);
  }
  return index;
};

/**
 * Applies one MapData entry to a MapLibre source via setFeatureState.
 * - When `joinKey` is omitted, `geometryId` is matched against `feature.id`.
 * - When `joinKey` is set, features are queried and indexed by
 *   `feature.properties[joinKey]` to recover the underlying `feature.id`.
 *
 * Caller is responsible for ensuring the source is loaded before calling.
 */
export const applyMapDataToSource = (
  map: maplibregl.Map,
  mapData: MapData
): void => {
  if (!map.getSource(mapData.mapId)) return;

  if (!mapData.joinKey) {
    for (const row of mapData.data) {
      const safeValue =
        typeof row.value === 'number' && !Number.isFinite(row.value)
          ? 0
          : row.value;
      map.setFeatureState(
        { source: mapData.mapId, id: row.geometryId },
        { value: safeValue }
      );
    }
    return;
  }

  const features = map.querySourceFeatures(mapData.mapId);
  const idByJoinKey = buildJoinKeyIndex(features, mapData.joinKey);
  for (const row of mapData.data) {
    const fid = idByJoinKey.get(String(row.geometryId));
    if (fid == null) continue;
    const safeValue =
      typeof row.value === 'number' && !Number.isFinite(row.value)
        ? 0
        : row.value;
    map.setFeatureState(
      { source: mapData.mapId, id: fid },
      { value: safeValue }
    );
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
 * When `joinKey` is absent, removes directly by `row.geometryId`.
 * When `joinKey` is set, resolves `feature.id` via `querySourceFeatures` before removing.
 * Silently returns when the source does not exist or is not yet loaded (joinKey path).
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

  if (!mapData.joinKey) {
    for (const row of mapData.data) {
      map.removeFeatureState({ source: mapData.mapId, id: row.geometryId });
    }
    return;
  }

  if (!map.isSourceLoaded(mapData.mapId)) return;
  const features = map.querySourceFeatures(mapData.mapId);
  const idByJoinKey = buildJoinKeyIndex(features, mapData.joinKey);
  for (const row of mapData.data) {
    const fid = idByJoinKey.get(String(row.geometryId));
    if (fid == null) continue;
    map.removeFeatureState({ source: mapData.mapId, id: fid });
  }
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

/** Applies a single-row value update to the map via `setFeatureState`. Resolves feature id via joinKey when set. */
const applyRowReplacement = (
  map: maplibregl.Map,
  mapData: MapData,
  geometryId: string,
  value: MapDataRow['value']
): void => {
  if (!mapData.joinKey) {
    // Resolve the original geometryId type from the stored row so numeric
    // feature ids (e.g. 1) are not coerced to strings ('1'), which would
    // cause setFeatureState to miss the intended feature.
    const row = mapData.data.find((r) => {
      return String(r.geometryId) === geometryId;
    });
    const featureId = row?.geometryId ?? coerceGeometryId(geometryId);
    map.setFeatureState({ source: mapData.mapId, id: featureId }, { value });
    return;
  }
  if (!map.isSourceLoaded(mapData.mapId)) return;
  const f = map.querySourceFeatures(mapData.mapId).find((feat) => {
    const k = feat.properties?.[mapData.joinKey as string];
    return k != null && String(k) === geometryId;
  });
  if (f?.id != null) {
    map.setFeatureState({ source: mapData.mapId, id: f.id }, { value });
  }
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
