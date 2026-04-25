import type { MapData, MapDataRow, VisualizationSpec } from './types';

/** Returns a new `MapData` with the matching row updated to `value`, appending a new row when absent. */
const replaceRow = (
  md: MapData,
  geometryId: string,
  value: MapDataRow['value']
): MapData => {
  const matchId = (rid: string | number) => {
    return String(rid) === geometryId;
  };
  const has = md.data.some((row) => {
    return matchId(row.geometryId);
  });
  const data = has
    ? md.data.map((row) => {
        return matchId(row.geometryId)
          ? { geometryId: row.geometryId, value }
          : row;
      })
    : [...md.data, { geometryId, value }];
  return { ...md, data };
};

/** Dispatches a replace patch by path depth: 2-part = full entry, 4-part = single row update. */
const applyReplace = (
  spec: VisualizationSpec,
  patch: { path?: string; value?: unknown }
): VisualizationSpec => {
  if (!patch.path) return spec;
  const existing = spec.mapData ?? [];
  const parts = patch.path.split('.');
  if (parts.length < 2 || parts[0] !== 'mapData') return spec;
  const mapDataId = parts[1];

  if (parts.length === 2) {
    return {
      ...spec,
      mapData: existing.map((md) => {
        return md.mapDataId === mapDataId ? (patch.value as MapData) : md;
      }),
    };
  }

  if (parts.length === 4 && parts[2] === 'data') {
    const geometryId = parts[3];
    const value = patch.value as MapDataRow['value'];
    return {
      ...spec,
      mapData: existing.map((md) => {
        return md.mapDataId === mapDataId
          ? replaceRow(md, geometryId, value)
          : md;
      }),
    };
  }

  return spec;
};

/**
 * Pure helper: produces the next `VisualizationSpec` after applying a
 * mapData-targeted patch. Shared by the runtime and the MapLibre adapter
 * so both keep an identical view of `currentSpec.mapData`.
 *
 * Supported `op`s:
 * - `add`: `value: MapData` → appended to `mapData[]`.
 * - `remove`: `value: string` (mapDataId) → entry removed.
 * - `replace`:
 *   - `path: "mapData.<mapDataId>"` + `value: MapData` → entry replaced.
 *   - `path: "mapData.<mapDataId>.data.<geometryId>"` + `value: MapDataRow['value']`
 *     → single row's value updated (or appended when geometryId is new).
 *
 * Returns the original spec unchanged when the patch shape is not recognised.
 */
export const applyMapDataPatchToSpec = (
  spec: VisualizationSpec,
  patch: {
    op: 'add' | 'remove' | 'replace';
    path?: string;
    value?: unknown;
  }
): VisualizationSpec => {
  const existing = spec.mapData ?? [];

  if (patch.op === 'add' && patch.value != null) {
    return { ...spec, mapData: [...existing, patch.value as MapData] };
  }

  if (patch.op === 'remove') {
    const mapDataId = patch.value as string;
    return {
      ...spec,
      mapData: existing.filter((md) => {
        return md.mapDataId !== mapDataId;
      }),
    };
  }

  if (patch.op !== 'replace') return spec;
  return applyReplace(spec, patch);
};
