import type maplibregl from 'maplibre-gl';

import type { MapData, MapDataRow, VisualizationSpec } from '../../spec/types';

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
      map.setFeatureState(
        { source: mapData.mapId, id: row.geometryId },
        { value: row.value }
      );
    }
    return;
  }

  const features = map.querySourceFeatures(mapData.mapId);
  const idByJoinKey = new Map<string, string | number>();
  for (const f of features) {
    const k = f.properties?.[mapData.joinKey];
    if (k == null || f.id == null) continue;
    idByJoinKey.set(String(k), f.id as string | number);
  }
  for (const row of mapData.data) {
    const fid = idByJoinKey.get(String(row.geometryId));
    if (fid == null) continue;
    map.setFeatureState(
      { source: mapData.mapId, id: fid },
      { value: row.value }
    );
  }
};

/**
 * Schedules `applyMapDataToSource` to run as soon as the underlying source
 * is loaded. If already loaded, runs synchronously. Otherwise listens on
 * `sourcedata` and removes itself after the first successful application.
 */
export const scheduleMapDataApply = (
  map: maplibregl.Map,
  mapData: MapData
): void => {
  if (map.isSourceLoaded(mapData.mapId)) {
    applyMapDataToSource(map, mapData);
    return;
  }
  const listener = (e: maplibregl.MapSourceDataEvent) => {
    if (e.sourceId !== mapData.mapId || !e.isSourceLoaded) return;
    applyMapDataToSource(map, mapData);
    map.off('sourcedata', listener);
  };
  map.on('sourcedata', listener);
};

/**
 * Removes all feature state set by a `MapData` entry from its MapLibre source.
 *
 * @remarks
 * Used when a `mapData` entry is removed via a `remove` patch so MapLibre
 * stops applying stale data-driven styling to the affected features.
 * Silently returns when the source does not exist (already removed).
 */
export const removeMapDataFromSource = (
  map: maplibregl.Map,
  mapData: MapData
): void => {
  if (!map.getSource(mapData.mapId)) return;
  for (const row of mapData.data) {
    map.removeFeatureState({ source: mapData.mapId, id: row.geometryId });
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

/**
 * Applies a single-row value update to the live MapLibre map via
 * `setFeatureState`.
 *
 * @remarks
 * When `joinKey` is absent, the feature is looked up directly by `geometryId`.
 * When `joinKey` is present, a full source query (`querySourceFeatures`) is
 * performed to resolve the feature's internal `id` — this is more expensive
 * and silently skips if the source is not yet loaded.
 */
const applyRowReplacement = (
  map: maplibregl.Map,
  mapData: MapData,
  geometryId: string,
  value: MapDataRow['value']
): void => {
  if (!mapData.joinKey) {
    map.setFeatureState({ source: mapData.mapId, id: geometryId }, { value });
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

/**
 * Handles a `replace` patch against the live map for `mapData` entries.
 *
 * @remarks
 * Two granularity levels are supported based on `patch.path` depth:
 * - 2 segments (`mapData.<id>`) — full entry replacement: removes old feature
 *   state, then schedules a full `applyMapDataToSource` for the new value.
 * - 4 segments (`mapData.<id>.data.<geometryId>`) — targeted row update via
 *   `applyRowReplacement`, leaving unrelated features untouched.
 */
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
    const target = currentMapData.find((md) => {
      return md.mapDataId === (patch.value as string);
    });
    if (target) removeMapDataFromSource(map, target);
    return;
  }
  if (patch.op === 'replace') {
    handleMapDataReplace(map, currentMapData, patch);
  }
};
