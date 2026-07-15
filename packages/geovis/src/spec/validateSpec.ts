import Ajv2020 from 'ajv/dist/2020';

import type { CapabilitySet } from '../runtime/adapter';
import type { GeoVisIssue, GeoVisResult } from './result';
import { resolveOverallStatus } from './result';
import schema from './schema.json';
import type { VisualizationSpec } from './types';
import {
  validateFilterCapabilities,
  validateLayerCapabilities,
  validateSourceCapabilities,
  validateViewCapabilities,
} from './validateSpec.capabilityChecks';
import {
  validateLegendThresholdOrder,
  validateMapDataDimensions,
  validateSchemaVersion,
  validateSizeBy,
} from './validateSpec.checks';
import { validateReferences } from './validateSpec.referenceChecks';

const ajv = new Ajv2020({ strict: false });
const _validate = ajv.compile(schema);

/**
 * Validates a raw value against the GeoVis JSON Schema and enforces cross-field
 * referential integrity rules not expressible in the schema. Returns a
 * `GeoVisResult`: `{ status: 'resolved', spec, warnings }` on success, or a
 * failure status carrying every issue found in one pass — never only the
 * first — so a repair loop can fix everything in one round trip.
 *
 * `capabilities`, when provided (typically the active adapter's declared
 * `CapabilitySet`), additionally rejects sources/layers/view features the
 * adapter cannot render. Without it, only the schema-hardcoded default
 * (feature-state joining restricted to `geojson`) is enforced — this keeps
 * `validateSpec` usable standalone (CI, authoring tools) without an adapter.
 */
export const validateSpec = (
  input: unknown,
  capabilities?: CapabilitySet
): GeoVisResult => {
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
    ...validateSchemaVersion(spec),
    ...validateReferences(spec, capabilities),
    ...validateLegendThresholdOrder(spec),
    ...validateSizeBy(spec),
    ...validateMapDataDimensions(spec),
    ...(capabilities ? validateSourceCapabilities(spec, capabilities) : []),
    ...(capabilities ? validateLayerCapabilities(spec, capabilities) : []),
    ...(capabilities ? validateFilterCapabilities(spec, capabilities) : []),
    ...(capabilities ? validateViewCapabilities(spec, capabilities) : []),
  ];

  if (issues.length > 0) {
    return { status: resolveOverallStatus(issues), issues };
  }

  return { status: 'resolved', spec, warnings: [] };
};
