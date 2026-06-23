import { resolveChoropleth } from './mapTypeDefaults/chropleth';
import type { LegendSpec, VisualizationSpec } from './types';

/** Finds the best matching resolved legend for a user legend. */
const findMatchingResolvedLegend = (
  userLegend: LegendSpec,
  resolvedLegends: LegendSpec[],
  index: number
): LegendSpec | undefined => {
  const byId = resolvedLegends.find((r) => {
    return r.id === userLegend.id;
  });
  if (byId) return byId;
  if (resolvedLegends.length === 1) return resolvedLegends[0];
  return resolvedLegends[index];
};

/**
 * Merges user-provided legends with auto-generated ones.
 * When a user legend lacks `colorBy`, it inherits from the matching
 * resolved legend. When the user provides a partial `colorBy` (e.g.
 * only `colors`), the missing fields are filled from the auto-generated one.
 */
const mergeLegends = (
  userLegends: LegendSpec[],
  resolvedLegends: LegendSpec[]
): LegendSpec[] => {
  return userLegends.map((userLegend, index) => {
    const match = findMatchingResolvedLegend(
      userLegend,
      resolvedLegends,
      index
    );
    if (!match) return userLegend;
    if (!userLegend.colorBy) {
      return { ...userLegend, colorBy: match.colorBy };
    }
    if (
      match.colorBy.type === 'quantitative' &&
      userLegend.colorBy.type === 'quantitative'
    ) {
      return {
        ...userLegend,
        colorBy: { ...match.colorBy, ...userLegend.colorBy },
      };
    }
    return userLegend;
  });
};

const findFirstGeoJsonSource = (sources: VisualizationSpec['sources']) => {
  return sources.find((s) => {
    return s.type === 'geojson';
  });
};

/**
 * Resolves a spec with mapType into a full VisualizationSpec
 * by auto-generating layers, legends, and mapData defaults.
 *
 * Returns the resolved spec unchanged if no mapType is set.
 *
 * This is a pure function — no React hooks, no side effects.
 * Call it before passing the spec to <GeoVis>:
 *
 * ```tsx
 * const resolved = resolveSpecFromMapType(mySpec);
 * return <GeoVis spec={resolved} />;
 * ```
 */
export const resolveSpecFromMapType = (
  spec: VisualizationSpec
): VisualizationSpec => {
  if (!spec.mapType) return spec;

  const source = findFirstGeoJsonSource(spec.sources);
  if (!source) return spec;

  const firstMapData = spec.mapData?.[0];
  const userLayers = spec.layers ?? [];
  const userLegends = spec.legends ?? [];

  if (spec.mapType !== 'choropleth' || !firstMapData) return spec;

  const resolved = resolveChoropleth(
    spec as Extract<VisualizationSpec, { mapType: 'choropleth' }>,
    source.id,
    firstMapData
  );

  return {
    ...spec,
    layers: userLayers.length > 0 ? userLayers : resolved.layers,
    legends:
      userLegends.length > 0
        ? mergeLegends(userLegends, resolved.legends)
        : resolved.legends,
  };
};
