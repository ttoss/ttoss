import Ajv2020 from 'ajv/dist/2020';

import schema from './schema.json';
import type { VisualizationSpec } from './types';

export type ValidationResult =
  | { valid: true; spec: VisualizationSpec }
  | { valid: false; errors: string[] };

const ajv = new Ajv2020({ strict: false });
const _validate = ajv.compile(schema);

/**
 * Cross-field referential checks not expressible in JSON Schema:
 * - `mapData[].mapDataId` must be unique
 * - `mapData[].mapId` must reference an existing `geojson` source
 * - `layers[].mapDataId` must reference an existing `mapData[]` entry
 */
const validateReferences = (spec: VisualizationSpec): string[] => {
  const errors: string[] = [];
  const mapData = spec.mapData ?? [];

  const sourcesById = new Map(
    spec.sources.map((s) => {
      return [s.id, s] as const;
    })
  );

  const seenMapDataIds = new Set<string>();
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

  for (const layer of spec.layers) {
    if (layer.mapDataId && !seenMapDataIds.has(layer.mapDataId)) {
      errors.push(
        `layer '${layer.id}' references unknown mapDataId '${layer.mapDataId}'`
      );
    }
  }

  return errors;
};

/**
 * Validates a raw unknown value against the GeoVis JSON Schema and enforces
 * cross-field referential integrity rules not expressible in the schema.
 *
 * @remarks
 * Two-phase validation:
 * 1. **Structural** — AJV 2020-12 validates the JSON Schema (`schema.json`).
 * 2. **Referential** — `validateReferences` checks constraints such as unique
 *    `mapDataId`s, and that every `mapData[].mapId` resolves to an existing
 *    `geojson` source.
 *
 * Returns a discriminated union so callers can narrow on `result.valid`
 * without throwing. Errors are human-readable strings intended for
 * developer feedback, not end-user display.
 *
 * @param input - The raw value to validate (typically parsed JSON).
 * @returns `{ valid: true, spec }` on success;
 *   `{ valid: false, errors }` with diagnostic messages on failure.
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
