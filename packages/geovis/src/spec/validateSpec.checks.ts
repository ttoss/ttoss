import type { GeoVisIssue } from './result';
import type { VisualizationLayer, VisualizationSpec } from './types';
import { SPEC_SCHEMA_VERSION } from './types';

const isStrictlyAscending = (values: ReadonlyArray<number>): boolean => {
  for (let i = 1; i < values.length; i += 1) {
    if (values[i - 1] >= values[i]) return false;
  }
  return true;
};

export const validateLegendThresholdOrder = (
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
export const validateSizeBy = (spec: VisualizationSpec): GeoVisIssue[] => {
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
export const validateMapDataDimensions = (
  spec: VisualizationSpec
): GeoVisIssue[] => {
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
 * Validates `schemaVersion` against the version this build of `@ttoss/geovis`
 * understands. A spec that omits `schemaVersion` is assumed current — this
 * check only fires when a version is declared and it does not match.
 */
export const validateSchemaVersion = (
  spec: VisualizationSpec
): GeoVisIssue[] => {
  if (
    spec.schemaVersion === undefined ||
    spec.schemaVersion === SPEC_SCHEMA_VERSION
  ) {
    return [];
  }
  return [
    {
      code: 'invalid-schema-version',
      subject: { path: 'schemaVersion' },
      message: `spec declares schemaVersion ${spec.schemaVersion}, but this build of @ttoss/geovis understands version ${SPEC_SCHEMA_VERSION}`,
      repair: [
        {
          kind: 'set-value',
          path: 'schemaVersion',
          value: SPEC_SCHEMA_VERSION,
          label: `Set schemaVersion to ${SPEC_SCHEMA_VERSION}`,
        },
      ],
    },
  ];
};
