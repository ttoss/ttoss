import Ajv2020 from 'ajv/dist/2020';

import type { GeoVisIssue, GeoVisResult } from './result';
import { resolveOverallStatus } from './result';
import schema from './schema.json';
import type { VisualizationLayer, VisualizationSpec } from './types';

const ajv = new Ajv2020({ strict: false });
const _validate = ajv.compile(schema);

/** Validates layer-to-mapData referential integrity and source-scope alignment. */
const validateLayerMapDataRefs = (
  layers: VisualizationSpec['layers'],
  seenMapDataIds: Set<string>,
  mapDataById: Map<string, NonNullable<VisualizationSpec['mapData']>[number]>
): GeoVisIssue[] => {
  const issues: GeoVisIssue[] = [];
  const allowedMapDataIds = [...seenMapDataIds];

  for (const layer of layers) {
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
const validateReferences = (spec: VisualizationSpec): GeoVisIssue[] => {
  const issues: GeoVisIssue[] = [];
  const mapData = spec.mapData ?? [];

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
    } else if (source.type !== 'geojson') {
      issues.push({
        code: 'unsupported-source-type',
        subject: { path: `mapData[${md.mapDataId}].mapId`, id: md.mapDataId },
        message: `mapData '${md.mapDataId}' mapId '${md.mapId}' must point to a geojson source (got '${source.type}')`,
        repair: [
          {
            kind: 'allowed-values',
            path: `sources[${source.id}].type`,
            values: ['geojson'],
          },
        ],
      });
    }
  }

  issues.push(
    ...validateLayerMapDataRefs(spec.layers, seenMapDataIds, mapDataById)
  );

  return issues;
};

const isStrictlyAscending = (values: ReadonlyArray<number>): boolean => {
  for (let i = 1; i < values.length; i += 1) {
    if (values[i - 1] >= values[i]) return false;
  }
  return true;
};

const validateLegendThresholdOrder = (
  spec: VisualizationSpec
): GeoVisIssue[] => {
  const issues: GeoVisIssue[] = [];

  const validateThresholdLegend = (
    legend:
      | NonNullable<VisualizationSpec['legends']>[number]
      | NonNullable<VisualizationSpec['layers'][number]['legends']>[number],
    scope: string,
    path: string
  ) => {
    if (!legend.colorBy || legend.colorBy.type !== 'quantitative') return;
    if (legend.colorBy.scale !== 'threshold') return;

    const thresholds = legend.colorBy.thresholds ?? [];
    if (thresholds.length === 0) return;

    const finiteThresholds = thresholds.filter((value) => {
      return Number.isFinite(value);
    });
    if (finiteThresholds.length !== thresholds.length) {
      issues.push({
        code: 'invalid-threshold-value',
        subject: { path, id: legend.id },
        message: `${scope} has non-finite threshold values; use finite numeric values only`,
      });
      return;
    }

    if (thresholds.length > 1 && !isStrictlyAscending(thresholds)) {
      issues.push({
        code: 'invalid-threshold-order',
        subject: { path, id: legend.id },
        message: `${scope} must declare thresholds in strictly ascending order`,
      });
    }
  };

  for (const legend of spec.legends ?? []) {
    validateThresholdLegend(
      legend,
      `legend '${legend.id}'`,
      `legends[${legend.id}].colorBy.thresholds`
    );
  }

  for (const layer of spec.layers) {
    for (const legend of layer.legends ?? []) {
      validateThresholdLegend(
        legend,
        `layer '${layer.id}' legend '${legend.id}'`,
        `layers[${layer.id}].legends[${legend.id}].colorBy.thresholds`
      );
    }
  }

  return issues;
};

const hasActiveLegend = (
  layer: VisualizationLayer,
  specLegends?: VisualizationSpec['legends']
): boolean => {
  if (!layer.activeLegendId) return false;
  const resolveLegend = (l: { id: string }) => {
    return l.id === layer.activeLegendId;
  };
  const legend =
    layer.legends?.find(resolveLegend) ?? specLegends?.find(resolveLegend);
  if (!legend || !legend.colorBy) return false;
  // Stepped sizeBy requires a quantitative threshold legend to derive breaks.
  // Categorical or non-threshold legends cannot supply numeric thresholds.
  return (
    legend.colorBy.type === 'quantitative' &&
    legend.colorBy.scale === 'threshold'
  );
};

/** Validates thresholds values for a sizeBy layer. */
const validateSizeByThresholds = (
  layer: VisualizationLayer,
  thresholds: number[] | undefined
): GeoVisIssue[] => {
  if (!thresholds || thresholds.length === 0) return [];
  const path = `layers[${layer.id}].sizeBy.thresholds`;
  const finiteThresholds = thresholds.filter((value) => {
    return Number.isFinite(value);
  });
  if (finiteThresholds.length !== thresholds.length) {
    return [
      {
        code: 'invalid-threshold-value',
        subject: { path, id: layer.id },
        message: `layer '${layer.id}' sizeBy.thresholds has non-finite values; use finite numeric values only`,
      },
    ];
  }
  if (thresholds.length > 1 && !isStrictlyAscending(thresholds)) {
    return [
      {
        code: 'invalid-threshold-order',
        subject: { path, id: layer.id },
        message: `layer '${layer.id}' sizeBy.thresholds must be in strictly ascending order`,
      },
    ];
  }
  return [];
};

/** Validates sizeBy.range values are finite and ordered correctly. */
const validateSizeByRange = (
  layer: VisualizationLayer,
  range: [number, number]
): GeoVisIssue[] => {
  const [min, max] = range;
  const path = `layers[${layer.id}].sizeBy.range`;
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return [
      {
        code: 'invalid-size-range',
        subject: { path, id: layer.id },
        message: `layer '${layer.id}' sizeBy.range values must be finite numbers, got [${min}, ${max}]`,
      },
    ];
  }
  if (min >= max || min <= 0) {
    return [
      {
        code: 'invalid-size-range',
        subject: { path, id: layer.id },
        message: `layer '${layer.id}' sizeBy.range must have min < max and both > 0, got [${min}, ${max}]`,
      },
    ];
  }
  return [];
};

/** Validates a single layer's sizeBy constraints. */
const validateSizeByLayer = (
  layer: VisualizationLayer,
  specLegends?: VisualizationSpec['legends']
): GeoVisIssue[] => {
  if (!layer.sizeBy) return [];

  const { range, mode, thresholds } = layer.sizeBy;
  const issues = validateSizeByRange(layer, range);

  const needsLegend =
    mode === 'stepped' && (!thresholds || thresholds.length === 0);
  if (needsLegend && !hasActiveLegend(layer, specLegends)) {
    issues.push({
      code: 'invalid-size-mode',
      subject: { path: `layers[${layer.id}].sizeBy.mode`, id: layer.id },
      message: `layer '${layer.id}' sizeBy in stepped mode requires thresholds or an active legend with quantitative thresholds`,
    });
  }

  issues.push(...validateSizeByThresholds(layer, thresholds));
  return issues;
};

/** Validates `sizeBy` constraints on layers that declare it. */
const validateSizeBy = (spec: VisualizationSpec): GeoVisIssue[] => {
  const issues: GeoVisIssue[] = [];
  for (const layer of spec.layers) {
    issues.push(...validateSizeByLayer(layer, spec.legends));
  }
  return issues;
};

/** Validates a group of dimensioned entries on the same source. */
const validateDimensionGroup = (
  mapId: string,
  entries: Array<{ mapDataId: string; dimension?: string; stateKey?: string }>
): GeoVisIssue[] => {
  const issues: GeoVisIssue[] = [];
  const seenDimensions = new Map<string, string>();
  const seenStateKeys = new Map<string, string>();
  for (const entry of entries) {
    const prevDim = seenDimensions.get(entry.dimension!);
    if (prevDim) {
      issues.push({
        code: 'duplicate-dimension',
        subject: {
          path: `mapData[${entry.mapDataId}].dimension`,
          id: entry.mapDataId,
        },
        message: `source '${mapId}' has duplicate dimension '${entry.dimension}' on mapData '${prevDim}' and '${entry.mapDataId}'`,
      });
    }
    seenDimensions.set(entry.dimension!, entry.mapDataId);

    const effectiveKey = entry.stateKey ?? 'value';
    const prevKey = seenStateKeys.get(effectiveKey);
    if (prevKey && entries.length > 1) {
      issues.push({
        code: 'state-key-collision',
        subject: {
          path: `mapData[${entry.mapDataId}].stateKey`,
          id: entry.mapDataId,
        },
        message: `source '${mapId}' has multiple dimensioned datasets sharing stateKey '${effectiveKey}' (mapData '${prevKey}' and '${entry.mapDataId}'): each dimension must declare a unique stateKey`,
      });
    }
    seenStateKeys.set(effectiveKey, entry.mapDataId);
  }
  return issues;
};

/** Validates MapData dimension declarations: no duplicate dimensions per source. */
const validateMapDataDimensions = (spec: VisualizationSpec): GeoVisIssue[] => {
  const mapData = spec.mapData ?? [];

  const bySource = new Map<
    string,
    Array<{ mapDataId: string; dimension?: string; stateKey?: string }>
  >();
  for (const md of mapData) {
    if (!md.dimension) continue;
    const group = bySource.get(md.mapId) ?? [];
    group.push({
      mapDataId: md.mapDataId,
      dimension: md.dimension,
      stateKey: md.stateKey,
    });
    bySource.set(md.mapId, group);
  }

  const issues: GeoVisIssue[] = [];
  for (const [mapId, entries] of bySource) {
    issues.push(...validateDimensionGroup(mapId, entries));
  }

  return issues;
};

/**
 * Validates a raw value against the GeoVis JSON Schema and enforces cross-field
 * referential integrity rules not expressible in the schema. Returns a
 * `GeoVisResult`: `{ status: 'resolved', spec, warnings }` on success, or a
 * failure status carrying every issue found in one pass — never only the
 * first — so a repair loop can fix everything in one round trip.
 */
export const validateSpec = (input: unknown): GeoVisResult => {
  const schemaValid = _validate(input);

  if (!schemaValid) {
    const issues: GeoVisIssue[] = (_validate.errors ?? []).map((e) => {
      const path = e.instancePath || '(root)';
      return {
        code: 'invalid-schema',
        subject: { path },
        message: `${path} ${e.message}`,
      };
    });
    return { status: 'invalid', issues };
  }

  const spec = input as unknown as VisualizationSpec;
  const issues: GeoVisIssue[] = [
    ...validateReferences(spec),
    ...validateLegendThresholdOrder(spec),
    ...validateSizeBy(spec),
    ...validateMapDataDimensions(spec),
  ];

  if (issues.length > 0) {
    return { status: resolveOverallStatus(issues), issues };
  }

  return { status: 'resolved', spec, warnings: [] };
};
