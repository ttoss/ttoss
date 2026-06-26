import { resolveChoropleth } from './mapTypeDefaults/choropleth';
import { resolveDotDensity } from './mapTypeDefaults/dotDensity';
import type {
  LegendSpec,
  VisualizationLayer,
  VisualizationSpec,
} from './types';

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

const matchLayer = (
  ul: VisualizationLayer,
  rl: VisualizationLayer,
  isOnlyResolved: boolean
): boolean => {
  if (isOnlyResolved && rl.geometry === 'point' && ul.geometry === 'point') {
    return true;
  }
  return ul.sourceId === rl.sourceId && ul.geometry === rl.geometry;
};

const injectResolvedFields = (
  match: VisualizationLayer,
  rl: VisualizationLayer
): void => {
  if (rl.sizeBy && !match.sizeBy) {
    (match as Record<string, unknown>).sizeBy = rl.sizeBy;
  }
  if (rl.mapDataId && !match.mapDataId) {
    (match as Record<string, unknown>).mapDataId = rl.mapDataId;
  }
  if (rl.activeLegendId && !match.activeLegendId) {
    (match as Record<string, unknown>).activeLegendId = rl.activeLegendId;
  }
  if (rl.paint) {
    match.paint = { ...rl.paint, ...match.paint };
  }
};

/**
 * Merges auto-generated resolved layers into user-provided layers.
 * For each resolved layer:
 * - If a user layer with the same sourceId and geometry exists, inject
 *   sizeBy/mapDataId/activeLegendId and merge paint.
 * - Otherwise, append the resolved layer.
 */
const mergeResolvedLayers = (
  userLayers: VisualizationLayer[],
  resolvedLayers: VisualizationLayer[]
): VisualizationLayer[] => {
  const merged = [...userLayers];
  const resolvedPoints = resolvedLayers.filter((rl) => {
    return rl.geometry === 'point';
  });
  const isOnlyResolved =
    resolvedPoints.length === 1 && resolvedLayers.length === 1;

  for (const rl of resolvedLayers) {
    const match = merged.find((ul) => {
      return matchLayer(ul, rl, isOnlyResolved);
    });
    if (match) {
      injectResolvedFields(match, rl);
    } else {
      merged.push(rl);
    }
  }
  return merged;
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

type ResolvedResult = {
  layers: VisualizationSpec['layers'];
  legends: LegendSpec[];
};

const applyResolved = (
  spec: VisualizationSpec,
  resolved: ResolvedResult
): VisualizationSpec => {
  const userLayers = spec.layers ?? [];
  const userLegends = spec.legends ?? [];

  const layers =
    userLayers.length > 0
      ? mergeResolvedLayers(userLayers, resolved.layers)
      : resolved.layers;

  return {
    ...spec,
    layers,
    legends:
      userLegends.length > 0
        ? mergeLegends(userLegends, resolved.legends)
        : resolved.legends,
  };
};

/**
 * Resolves a spec with `mapType` into a full `VisualizationSpec`
 * by auto-generating layers, legends, and `mapData` defaults.
 *
 * Returns the spec unchanged if no `mapType` is set.
 *
 * This is a pure function (no React hooks, no side effects).
 * It is called automatically by the runtime and `GeoVisProvider`
 * — consumers do **not** need to call it manually.
 */
export const resolveSpecFromMapType = (
  spec: VisualizationSpec
): VisualizationSpec => {
  if (!spec.mapType) return spec;

  if (spec.mapType === 'dotDensity') {
    const resolved = resolveDotDensity(spec);
    return applyResolved(spec, resolved);
  }

  if (spec.mapType !== 'choropleth') return spec;

  const resolved = resolveChoropleth(spec);
  return applyResolved(spec, resolved);
};
