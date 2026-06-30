import { resolveChoropleth } from './mapTypeDefaults/choropleth';
import { resolveDotDensity } from './mapTypeDefaults/dotDensity';
import { resolveProportionalCircles } from './mapTypeDefaults/proportionalCircles';
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
  rl: VisualizationLayer
): boolean => {
  return ul.sourceId === rl.sourceId && ul.geometry === rl.geometry;
};

// Keys that should not be overwritten when injecting resolved fields
const STRUCTURAL_KEYS = new Set<string>([
  'id',
  'sourceId',
  'geometry',
  'paint',
]);

/**
 * Injects missing fields from a resolved layer into a user layer.
 * - If the user layer lacks `sizeBy`, `mapDataId`, or `activeLegendId`,
 *   they are filled from the resolved layer.
 * - If the user layer has a `paint` object, it is merged with the resolved
 *   layer's paint, with user-provided values taking precedence.
 *
 * OBS: This avoids overwriting user-provided values while ensuring that essential
 * fields from the resolved layer are present.
 */
const injectResolvedFields = (
  match: VisualizationLayer,
  rl: VisualizationLayer
): void => {
  for (const key of Object.keys(rl)) {
    if (STRUCTURAL_KEYS.has(key)) continue;
    const k = key as keyof VisualizationLayer;
    if (rl[k] && !match[k]) {
      (match as Record<string, unknown>)[k] = rl[k];
    }
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
  for (const rl of resolvedLayers) {
    const match = merged.find((ul) => {
      return matchLayer(ul, rl);
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
  const usedIds = new Set<string>();
  const merged = userLegends.map((userLegend, index) => {
    const match = findMatchingResolvedLegend(
      userLegend,
      resolvedLegends,
      index
    );
    if (!match || !match.colorBy) return userLegend;
    usedIds.add(match.id);
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
  for (const rl of resolvedLegends) {
    if (!usedIds.has(rl.id)) {
      merged.push(rl);
    }
  }
  return merged;
};

type ResolvedResult = {
  layers: VisualizationSpec['layers'];
  legends: LegendSpec[];
  /** Optional resolved visual scale ceiling (proportional circles only). */
  scaleMaxValue?: number;
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
    // Clear mapType so resolveSpecFromMapType is idempotent on already-resolved
    // specs — the GeoVisProvider + runtime both call it, and this avoids a
    // duplicate resolveSpecFromMapType on every control change.
    mapType: undefined,
    // A user-provided scaleMaxValue always wins; otherwise adopt the resolved one.
    scaleMaxValue: spec.scaleMaxValue ?? resolved.scaleMaxValue,
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

  if (spec.mapType === 'proportionalCircles') {
    const resolved = resolveProportionalCircles(spec);
    return applyResolved(spec, resolved);
  }

  if (spec.mapType === 'dotDensity') {
    const resolved = resolveDotDensity(spec);
    return applyResolved(spec, resolved);
  }

  if (spec.mapType !== 'choropleth') return spec;

  const resolved = resolveChoropleth(spec);
  return applyResolved(spec, resolved);
};
