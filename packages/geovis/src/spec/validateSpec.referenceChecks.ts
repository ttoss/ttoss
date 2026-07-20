import type { CapabilitySet } from '../runtime/adapter';
import type { GeoVisIssue } from './result';
import type { VisualizationSpec } from './types';

/** Used when `validateSpec` is called without an adapter (standalone JSON validation). */
export const DEFAULT_FEATURE_STATE_SOURCE_TYPES: VisualizationSpec['sources'][number]['type'][] =
  ['geojson'];

/** Validates layer-to-source and layer-to-mapData referential integrity, and source-scope alignment. */
const validateLayerMapDataRefs = (
  layers: VisualizationSpec['layers'],
  sourcesById: Map<string, VisualizationSpec['sources'][number]>,
  seenMapDataIds: Set<string>,
  mapDataById: Map<string, NonNullable<VisualizationSpec['mapData']>[number]>
): GeoVisIssue[] => {
  const issues: GeoVisIssue[] = [];
  const allowedMapDataIds = [...seenMapDataIds];
  const allowedSourceIds = [...sourcesById.keys()];

  for (const layer of layers) {
    if (!sourcesById.has(layer.sourceId)) {
      issues.push({
        code: 'unknown-source',
        subject: { path: `layers[${layer.id}].sourceId`, id: layer.id },
        message: `layer '${layer.id}' references unknown source '${layer.sourceId}'`,
        repair: [
          {
            kind: 'allowed-values',
            path: `layers[${layer.id}].sourceId`,
            values: allowedSourceIds,
          },
        ],
      });
    }
    if (!layer.mapDataId) continue;
    if (!seenMapDataIds.has(layer.mapDataId)) {
      issues.push({
        code: 'unknown-map-data-id',
        subject: { path: `layers[${layer.id}].mapDataId`, id: layer.id },
        message: `layer '${layer.id}' references unknown mapDataId '${layer.mapDataId}'`,
        repair: [
          {
            kind: 'allowed-values',
            path: `layers[${layer.id}].mapDataId`,
            values: allowedMapDataIds,
          },
        ],
      });
      continue;
    }
    const md = mapDataById.get(layer.mapDataId);
    if (md && md.mapId !== layer.sourceId) {
      issues.push({
        code: 'source-scope-conflict',
        subject: { path: `layers[${layer.id}].sourceId`, id: layer.id },
        message: `layer '${layer.id}' mapDataId '${layer.mapDataId}' points to source '${md.mapId}' but layer uses source '${layer.sourceId}'; feature-state is source-scoped so this dataset can never style this layer`,
        repair: [
          {
            kind: 'set-value',
            path: `layers[${layer.id}].sourceId`,
            value: md.mapId,
            label: `Point layer '${layer.id}' at source '${md.mapId}'`,
          },
        ],
      });
    }
  }
  return issues;
};

/** Checks referential integrity constraints not expressible in JSON Schema (unique mapDataId, FK sources, FK layers). */
export const validateReferences = (
  spec: VisualizationSpec,
  capabilities?: CapabilitySet
): GeoVisIssue[] => {
  const issues: GeoVisIssue[] = [];
  const mapData = spec.mapData ?? [];
  const featureStateSourceTypes =
    capabilities?.dataFeatures.featureState ??
    DEFAULT_FEATURE_STATE_SOURCE_TYPES;

  const sourcesById = new Map(
    spec.sources.map((s) => {
      return [s.id, s] as const;
    })
  );

  const seenMapDataIds = new Set<string>();
  const mapDataById = new Map(
    mapData.map((md) => {
      return [md.mapDataId, md] as const;
    })
  );
  for (const md of mapData) {
    if (seenMapDataIds.has(md.mapDataId)) {
      issues.push({
        code: 'duplicate-map-data-id',
        subject: {
          path: `mapData[${md.mapDataId}].mapDataId`,
          id: md.mapDataId,
        },
        message: `mapData mapDataId '${md.mapDataId}' must be unique`,
      });
    }
    seenMapDataIds.add(md.mapDataId);

    const source = sourcesById.get(md.mapId);
    if (!source) {
      issues.push({
        code: 'unknown-source',
        subject: { path: `mapData[${md.mapDataId}].mapId`, id: md.mapDataId },
        message: `mapData '${md.mapDataId}' references unknown source mapId '${md.mapId}'`,
        repair: [
          {
            kind: 'allowed-values',
            path: `mapData[${md.mapDataId}].mapId`,
            values: [...sourcesById.keys()],
          },
        ],
      });
    } else if (!featureStateSourceTypes.includes(source.type)) {
      issues.push({
        code: 'unsupported-source-type',
        subject: { path: `mapData[${md.mapDataId}].mapId`, id: md.mapDataId },
        message: `mapData '${md.mapDataId}' mapId '${md.mapId}' must point to a source type that supports feature-state joining (got '${source.type}')`,
        repair: [
          {
            kind: 'allowed-values',
            path: `sources[${source.id}].type`,
            values: featureStateSourceTypes,
          },
        ],
      });
    }
  }

  issues.push(
    ...validateLayerMapDataRefs(
      spec.layers,
      sourcesById,
      seenMapDataIds,
      mapDataById
    )
  );

  return issues;
};
