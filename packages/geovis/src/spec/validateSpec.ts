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
  if (refErrors.length > 0) {
    return { valid: false, errors: refErrors };
  }

  return { valid: true, spec };
};
