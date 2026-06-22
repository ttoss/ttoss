import Ajv2020 from 'ajv/dist/2020';

import schema from './schema.json';
import type { VisualizationSpec } from './types';

export type ValidationResult =
  | { valid: true; spec: VisualizationSpec }
  | { valid: false; errors: string[] };

const ajv = new Ajv2020({ strict: false });
const _validate = ajv.compile(schema);

/** Validates layer-to-mapData referential integrity and source-scope alignment. */
const validateLayerMapDataRefs = (
  layers: VisualizationSpec['layers'],
  seenMapDataIds: Set<string>,
  mapDataById: Map<string, NonNullable<VisualizationSpec['mapData']>[number]>
): string[] => {
  const errors: string[] = [];
  for (const layer of layers) {
    if (!layer.mapDataId) continue;
    if (!seenMapDataIds.has(layer.mapDataId)) {
      errors.push(
        `layer '${layer.id}' references unknown mapDataId '${layer.mapDataId}'`
      );
      continue;
    }
    const md = mapDataById.get(layer.mapDataId);
    if (md && md.mapId !== layer.sourceId) {
      errors.push(
        `layer '${layer.id}' mapDataId '${layer.mapDataId}' points to source '${md.mapId}' but layer uses source '${layer.sourceId}'; feature-state is source-scoped so this dataset can never style this layer`
      );
    }
  }
  return errors;
};

/** Checks referential integrity constraints not expressible in JSON Schema (unique mapDataId, FK sources, FK layers). */
const validateReferences = (spec: VisualizationSpec): string[] => {
  const errors: string[] = [];
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
      errors.push(`mapData mapDataId '${md.mapDataId}' must be unique`);
    }
    seenMapDataIds.add(md.mapDataId);

    const source = sourcesById.get(md.mapId);
    if (!source) {
      errors.push(
        `mapData '${md.mapDataId}' references unknown source mapId '${md.mapId}'`
      );
    } else if (source.type !== 'geojson') {
      errors.push(
        `mapData '${md.mapDataId}' mapId '${md.mapId}' must point to a geojson source (got '${source.type}')`
      );
    }
  }

  errors.push(
    ...validateLayerMapDataRefs(spec.layers, seenMapDataIds, mapDataById)
  );

  return errors;
};

const isStrictlyAscending = (values: ReadonlyArray<number>): boolean => {
  for (let i = 1; i < values.length; i += 1) {
    if (values[i - 1] >= values[i]) return false;
  }
  return true;
};

const validateLegendThresholdOrder = (spec: VisualizationSpec): string[] => {
  const errors: string[] = [];

  const validateThresholdLegend = (
    legend:
      | NonNullable<VisualizationSpec['legends']>[number]
      | NonNullable<VisualizationSpec['layers'][number]['legends']>[number],
    scope: string
  ) => {
    if (legend.colorBy.type !== 'quantitative') return;
    if (legend.colorBy.scale !== 'threshold') return;

    const thresholds = legend.colorBy.thresholds ?? [];
    if (thresholds.length === 0) return;

    const finiteThresholds = thresholds.filter((value) => {
      return Number.isFinite(value);
    });
    if (finiteThresholds.length !== thresholds.length) {
      errors.push(
        `${scope} has non-finite threshold values; use finite numeric values only`
      );
      return;
    }

    if (thresholds.length > 1 && !isStrictlyAscending(thresholds)) {
      errors.push(
        `${scope} must declare thresholds in strictly ascending order`
      );
    }
  };

  for (const legend of spec.legends ?? []) {
    validateThresholdLegend(legend, `legend '${legend.id}'`);
  }

  for (const layer of spec.layers) {
    for (const legend of layer.legends ?? []) {
      validateThresholdLegend(
        legend,
        `layer '${layer.id}' legend '${legend.id}'`
      );
    }
  }

  return errors;
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
  if (!legend) return false;
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
): string[] => {
  if (!thresholds || thresholds.length === 0) return [];
  const finiteThresholds = thresholds.filter((value) => {
    return Number.isFinite(value);
  });
  if (finiteThresholds.length !== thresholds.length) {
    return [
      `layer '${layer.id}' sizeBy.thresholds has non-finite values; use finite numeric values only`,
    ];
  }
  if (thresholds.length > 1 && !isStrictlyAscending(thresholds)) {
    return [
      `layer '${layer.id}' sizeBy.thresholds must be in strictly ascending order`,
    ];
  }
  return [];
};

/** Validates sizeBy.range values are finite and ordered correctly. */
const validateSizeByRange = (
  layer: VisualizationLayer,
  range: [number, number]
): string[] => {
  const [min, max] = range;
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return [
      `layer '${layer.id}' sizeBy.range values must be finite numbers, got [${min}, ${max}]`,
    ];
  }
  if (min >= max || min <= 0) {
    return [
      `layer '${layer.id}' sizeBy.range must have min < max and both > 0, got [${min}, ${max}]`,
    ];
  }
  return [];
};

/** Validates a single layer's sizeBy constraints. */
const validateSizeByLayer = (
  layer: VisualizationLayer,
  specLegends?: VisualizationSpec['legends']
): string[] => {
  if (!layer.sizeBy) return [];

  const { range, mode, thresholds, transform } = layer.sizeBy;
  const errors = validateSizeByRange(layer, range);

  const needsLegend =
    mode === 'stepped' && (!thresholds || thresholds.length === 0);
  if (needsLegend && !hasActiveLegend(layer, specLegends)) {
    errors.push(
      `layer '${layer.id}' sizeBy in stepped mode requires thresholds or an active legend with quantitative thresholds`
    );
  }

  if (mode === 'stepped' && transform === 'sqrt') {
    errors.push(
      `layer '${layer.id}' sizeBy does not support transform 'sqrt' in stepped mode`
    );
  }

  errors.push(...validateSizeByThresholds(layer, thresholds));
  return errors;
};

/** Validates `sizeBy` constraints on layers that declare it. */
const validateSizeBy = (spec: VisualizationSpec): string[] => {
  const errors: string[] = [];
  for (const layer of spec.layers) {
    errors.push(...validateSizeByLayer(layer, spec.legends));
  }
  return errors;
};

/** Validates a group of dimensioned entries on the same source. */
const validateDimensionGroup = (
  mapId: string,
  entries: Array<{ mapDataId: string; dimension?: string; stateKey?: string }>
): string[] => {
  const errors: string[] = [];
  const seenDimensions = new Map<string, string>();
  const seenStateKeys = new Map<string, string>();
  for (const entry of entries) {
    const prevDim = seenDimensions.get(entry.dimension!);
    if (prevDim) {
      errors.push(
        `source '${mapId}' has duplicate dimension '${entry.dimension}' on mapData '${prevDim}' and '${entry.mapDataId}'`
      );
    }
    seenDimensions.set(entry.dimension!, entry.mapDataId);

    const effectiveKey = entry.stateKey ?? 'value';
    const prevKey = seenStateKeys.get(effectiveKey);
    if (prevKey && entries.length > 1) {
      errors.push(
        `source '${mapId}' has multiple dimensioned datasets sharing stateKey '${effectiveKey}' (mapData '${prevKey}' and '${entry.mapDataId}'): each dimension must declare a unique stateKey`
      );
    }
    seenStateKeys.set(effectiveKey, entry.mapDataId);
  }
  return errors;
};

/** Validates MapData dimension declarations: no duplicate dimensions per source. */
const validateMapDataDimensions = (spec: VisualizationSpec): string[] => {
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

  const errors: string[] = [];
  for (const [mapId, entries] of bySource) {
    errors.push(...validateDimensionGroup(mapId, entries));
  }

  return errors;
};

/**
 * Validates a raw value against the GeoVis JSON Schema and enforces cross-field
 * referential integrity rules not expressible in the schema.
 * Returns a discriminated union: `{ valid: true, spec }` on success or
 * `{ valid: false, errors }` with human-readable diagnostic strings on failure.
 */
export const validateSpec = (input: unknown): ValidationResult => {
  const valid = _validate(input);

  if (!valid) {
    const errors = (_validate.errors ?? []).map((e) => {
      return `${e.instancePath || '(root)'} ${e.message}`;
    });
    return { valid: false, errors };
  }

  const spec = input as unknown as VisualizationSpec;
  const refErrors = validateReferences(spec);
  const thresholdErrors = validateLegendThresholdOrder(spec);
  const sizeByErrors = validateSizeBy(spec);
  const dimensionErrors = validateMapDataDimensions(spec);
  if (refErrors.length > 0) {
    return { valid: false, errors: refErrors };
  }

  if (thresholdErrors.length > 0) {
    return { valid: false, errors: thresholdErrors };
  }

  if (sizeByErrors.length > 0) {
    return { valid: false, errors: sizeByErrors };
  }

  if (dimensionErrors.length > 0) {
    return { valid: false, errors: dimensionErrors };
  }

  return { valid: true, spec };
};
