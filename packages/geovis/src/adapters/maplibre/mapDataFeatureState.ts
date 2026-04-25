import type maplibregl from 'maplibre-gl';

import type { MapData, MapDataRow, VisualizationSpec } from '../../spec/types';

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
      map.setFeatureState(
        { source: mapData.mapId, id: row.geometryId },
        { value: row.value }
      );
    }
    return;
  }

  const features = map.querySourceFeatures(mapData.mapId);
  const idByJoinKey = buildJoinKeyIndex(features, mapData.joinKey);
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
 * Removes all feature state set by a `MapData` entry from its source.
 * When `joinKey` is absent, removes directly by `row.geometryId`.
 * When `joinKey` is set, resolves `feature.id` via `querySourceFeatures` before removing.
 * Silently returns when the source does not exist or is not yet loaded (joinKey path).
 */
export const removeMapDataFromSource = (
  map: maplibregl.Map,
  mapData: MapData
): void => {
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
