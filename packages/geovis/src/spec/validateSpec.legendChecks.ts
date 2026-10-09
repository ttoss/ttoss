import type { GeoVisIssue } from './result';
import type { VisualizationLayer, VisualizationSpec } from './types';

/**
 * The legend ids a layer can activate: its own `legends` first, then the
 * spec's — the same two places the adapter looks an `activeLegendId` up in.
 */
const legendIdsFor = ({
  layer,
  spec,
}: {
  layer: VisualizationLayer;
  spec: VisualizationSpec;
}): string[] => {
  return [...(layer.legends ?? []), ...(spec.legends ?? [])].map((legend) => {
    return legend.id;
  });
};

/** The issue for one layer whose `activeLegendId` names no legend it sees. */
const validateLayerLegendRef = ({
  layer,
  spec,
}: {
  layer: VisualizationLayer;
  spec: VisualizationSpec;
}): GeoVisIssue[] => {
  if (!layer.activeLegendId) return [];
  const ids = legendIdsFor({ layer, spec });
  if (ids.includes(layer.activeLegendId)) return [];

  const path = `layers[${layer.id}].activeLegendId`;
  return [
    {
      code: 'unknown-legend-id',
      subject: { path, id: layer.id },
      message:
        ids.length > 0
          ? `layer '${layer.id}' references unknown activeLegendId '${layer.activeLegendId}'; it would render in a default colour instead of by its data`
          : `layer '${layer.id}' references activeLegendId '${layer.activeLegendId}', but neither the layer nor the spec declares any legend`,
      ...(ids.length > 0 && {
        repair: [{ kind: 'allowed-values' as const, path, values: ids }],
      }),
    },
  ];
};

/**
 * Validates every `activeLegendId` against the legends its layer can see. A
 * dangling id would otherwise pass and render the layer in the adapter's
 * default colour — a data-driven layer silently turned flat.
 *
 * @param spec - The spec to check.
 * @returns One issue per dangling `activeLegendId`.
 */
export const validateLegendRefs = (spec: VisualizationSpec): GeoVisIssue[] => {
  return spec.layers.flatMap((layer) => {
    return validateLayerLegendRef({ layer, spec });
  });
};
