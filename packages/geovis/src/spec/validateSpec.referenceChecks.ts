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

/**
 * Validates that every layer mounted on a `vector-tiles` source declares
 * `sourceLayer`. Without it the tileset has no way to know which layer of
 * the tile to read, so the layer renders nothing. No `repair` is offered:
 * the correct `sourceLayer` name is external tileset metadata this check
 * has no way to know.
 */
const validateSourceLayerPresence = (
  layers: VisualizationSpec['layers'],
  sourcesById: Map<string, VisualizationSpec['sources'][number]>
): GeoVisIssue[] => {
  const issues: GeoVisIssue[] = [];
  for (const layer of layers) {
    const source = sourcesById.get(layer.sourceId);
    if (source?.type === 'vector-tiles' && !layer.sourceLayer) {
      issues.push({
        code: 'missing-source-layer',
        subject: { path: `layers[${layer.id}].sourceLayer`, id: layer.id },
        message: `layer '${layer.id}' uses a vector-tiles source but does not declare sourceLayer`,
      });
    }
  }
  return issues;
};

/**
 * True when a `proportionalCircles` spec derives its size data from a
 * layer's `propertyName` against an inline (non-URL) geojson source —
 * the one case where `mapType` may legitimately omit `mapData` entirely,
 * since size values are read straight from `feature.properties` instead of
 * a joined dataset. Mirrors `findSizeFromPropertyName` in
 * `spec/mapTypeDefaults/proportionalCircles.ts`.
 */
const hasInlinePropertyNameSizeSource = (spec: VisualizationSpec): boolean => {
  if (spec.mapType !== 'proportionalCircles') return false;
  const propLayer = spec.layers.find((l) => {
    return l.propertyName;
  });
  if (!propLayer) return false;
  const source = spec.sources.find((s) => {
    return s.id === propLayer.sourceId;
  });
  return (
    source?.type === 'geojson' &&
    typeof (source as { data?: unknown }).data !== 'string'
  );
};

/**
 * Validates that when `mapType` is set, at least one `mapData` entry maps
 * to a declared source — otherwise the mapType's zero-config layer/legend
 * resolution has nothing to render against and the map ends up empty.
 * Skipped for `proportionalCircles` specs that derive size from a layer's
 * `propertyName` against an inline geojson source (see
 * `hasInlinePropertyNameSizeSource`), which is a documented `mapData`-free
 * path for that mapType.
 */
const validateMapDataForMapType = (
  spec: VisualizationSpec,
  sourcesById: Map<string, VisualizationSpec['sources'][number]>
): GeoVisIssue[] => {
  if (!spec.mapType) return [];
  if (hasInlinePropertyNameSizeSource(spec)) return [];

  const hasValidMapData = (spec.mapData ?? []).some((md) => {
    return sourcesById.has(md.mapId);
  });
  if (hasValidMapData) return [];

  return [
    {
      code: 'missing-map-data-for-map-type',
      subject: { path: 'mapType' },
      message: `spec.mapType is '${spec.mapType}', but no mapData entry maps to a declared source; the map will render empty`,
    },
  ];
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

  issues.push(...validateSourceLayerPresence(spec.layers, sourcesById));
  issues.push(...validateMapDataForMapType(spec, sourcesById));

  return issues;
};
