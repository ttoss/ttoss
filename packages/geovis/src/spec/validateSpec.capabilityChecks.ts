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
