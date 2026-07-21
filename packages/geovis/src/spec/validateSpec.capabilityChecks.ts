import type { CapabilitySet } from '../runtime/adapter';
import type { GeoVisIssue } from './result';
import type { VisualizationSpec } from './types';

/** Validates that every declared source type is one the active adapter can mount. */
export const validateSourceCapabilities = (
  spec: VisualizationSpec,
  capabilities: CapabilitySet
): GeoVisIssue[] => {
  const issues: GeoVisIssue[] = [];
  for (const source of spec.sources) {
    if (!capabilities.sourceTypes.includes(source.type)) {
      issues.push({
        code: 'unsupported-source-type',
        subject: { path: `sources[${source.id}].type`, id: source.id },
        message: `source '${source.id}' has type '${source.type}', which the active adapter does not support`,
        repair: [
          {
            kind: 'allowed-values',
            path: `sources[${source.id}].type`,
            values: capabilities.sourceTypes,
          },
        ],
      });
    }
  }
  return issues;
};

/** Validates that every layer's geometry is one the active adapter can render. */
export const validateLayerCapabilities = (
  spec: VisualizationSpec,
  capabilities: CapabilitySet
): GeoVisIssue[] => {
  const issues: GeoVisIssue[] = [];
  for (const layer of spec.layers) {
    if (!capabilities.layerGeometries.includes(layer.geometry)) {
      issues.push({
        code: 'unsupported-layer-type',
        subject: { path: `layers[${layer.id}].geometry`, id: layer.id },
        message: `layer '${layer.id}' has geometry '${layer.geometry}', which the active adapter does not render`,
        repair: [
          {
            kind: 'allowed-values',
            path: `layers[${layer.id}].geometry`,
            values: capabilities.layerGeometries,
          },
        ],
      });
    }
  }
  return issues;
};

/**
 * Validates that every layer declaring `filter` targets a source type the
 * active adapter has fixture-tested filter compilation for
 * (`CapabilitySet.dataFeatures.filter`, PRD-002). First producer of the
 * `unsupported-data-feature` code — reserved since PRD-001, no other check
 * emits it yet.
 */
export const validateFilterCapabilities = (
  spec: VisualizationSpec,
  capabilities: CapabilitySet
): GeoVisIssue[] => {
  const issues: GeoVisIssue[] = [];
  const sourceTypeById = new Map(
    spec.sources.map((s) => {
      return [s.id, s.type] as const;
    })
  );
  for (const layer of spec.layers) {
    if (!layer.filter) continue;
    const sourceType = sourceTypeById.get(layer.sourceId);
    if (sourceType && capabilities.dataFeatures.filter.includes(sourceType)) {
      continue;
    }
    issues.push({
      code: 'unsupported-data-feature',
      subject: { path: `layers[${layer.id}].filter`, id: layer.id },
      message: `layer '${layer.id}' declares a filter, but its source type does not support filtering on the active adapter`,
      repair: [
        {
          kind: 'allowed-values',
          path: `sources[${layer.sourceId}].type`,
          values: capabilities.dataFeatures.filter,
        },
      ],
    });
  }
  return issues;
};

/** Validates that requested camera features (pitch, bearing) are supported by the active adapter. */
export const validateViewCapabilities = (
  spec: VisualizationSpec,
  capabilities: CapabilitySet
): GeoVisIssue[] => {
  const issues: GeoVisIssue[] = [];
  const view = spec.view;
  if (!view) return issues;

  if (view.pitch && !capabilities.viewFeatures.pitch) {
    issues.push({
      code: 'unsupported-view-feature',
      subject: { path: 'view.pitch' },
      message: `view.pitch is set to ${view.pitch}, but the active adapter does not support camera pitch`,
      repair: [
        {
          kind: 'set-value',
          path: 'view.pitch',
          value: 0,
          label: 'Remove pitch (flat view)',
        },
      ],
    });
  }

  if (view.bearing && !capabilities.viewFeatures.bearing) {
    issues.push({
      code: 'unsupported-view-feature',
      subject: { path: 'view.bearing' },
      message: `view.bearing is set to ${view.bearing}, but the active adapter does not support camera bearing`,
      repair: [
        {
          kind: 'set-value',
          path: 'view.bearing',
          value: 0,
          label: 'Remove bearing (north-up view)',
        },
      ],
    });
  }

  return issues;
};
