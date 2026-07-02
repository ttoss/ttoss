import { resolveChoropleth } from './mapTypeDefaults/choropleth';
import { resolveDotDensity } from './mapTypeDefaults/dotDensity';
import { resolveProportionalCircles } from './mapTypeDefaults/proportionalCircles';
import type {
  LegendSpec,
  VisualizationLayer,
  VisualizationSpec,
} from './types';

/**
 * Finds the best matching resolved legend for a user legend.
 *
 * An exact `id` match always wins. Otherwise, the positional/single-resolved
 * fallback is only used when that candidate actually has a `colorBy` to
 * contribute — a colorBy-less resolved legend (e.g. proportionalCircles'
 * size-only legend when `skipColorBy` applies) has nothing to merge into an
 * unrelated user legend, so pairing it here would incorrectly mark it "used"
 * and drop it instead of letting it be appended by `mergeLegends`'s trailing
 * loop. Returns `undefined` in that case so the resolved legend is preserved.
 */
export const findMatchingResolvedLegend = (
  userLegend: LegendSpec,
  resolvedLegends: LegendSpec[],
  index: number
): LegendSpec | undefined => {
  const byId = resolvedLegends.find((r) => {
    return r.id === userLegend.id;
  });
  if (byId) return byId;
  if (resolvedLegends.length === 1) {
    return resolvedLegends[0].colorBy ? resolvedLegends[0] : undefined;
  }
  const positional = resolvedLegends[index];
  return positional?.colorBy ? positional : undefined;
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
 * Builds a new layer with fields missing from `match` filled in from the
 * resolved layer.
 * - If the user layer lacks `sizeBy`, `mapDataId`, `activeLegendId`, or
 *   `legends`, they are filled from the resolved layer.
 * - If the user layer has a `paint` object, it is merged with the resolved
 *   layer's paint, with user-provided values taking precedence.
 *
 * Returns a new object — `match` (a reference into the caller's `spec.layers`)
 * is never mutated, so re-resolving the same spec object (e.g. `legendEnabled`
 * toggled via a shallow `{ ...spec, legendEnabled }` update that keeps the
 * same `layers` array) can't leave a stale `legends` entry stuck on the
 * shared layer object from a previous resolution.
 */
const injectResolvedFields = (
  match: VisualizationLayer,
  rl: VisualizationLayer
): VisualizationLayer => {
  const next: VisualizationLayer = { ...match };
  for (const key of Object.keys(rl)) {
    if (STRUCTURAL_KEYS.has(key)) continue;
    const k = key as keyof VisualizationLayer;
    if (rl[k] && !next[k]) {
      (next as unknown as Record<string, unknown>)[k] = rl[k];
    }
  }
  if (rl.paint) {
    next.paint = { ...rl.paint, ...match.paint };
  }
  return next;
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
    const matchIndex = merged.findIndex((ul) => {
      return matchLayer(ul, rl);
    });
    if (matchIndex >= 0) {
      merged[matchIndex] = injectResolvedFields(merged[matchIndex], rl);
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
export const mergeLegends = (
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
    if (!match) return userLegend;
    usedIds.add(match.id);
    if (!match.colorBy) return userLegend;
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
  // Append any resolved legends that were not matched to user legends.
  // This ensures that auto-generated legends are always included, even if the user did not provide a corresponding legend.
  // `usedIds` already covers every resolved id a user legend could share, because
  // `findMatchingResolvedLegend` always tries an exact id match across all of
  // `resolvedLegends` before falling back to positional pairing — so a resolved
  // id can never end up in `merged` without also landing in `usedIds`.
  for (const rl of resolvedLegends) {
    if (usedIds.has(rl.id)) continue;
    merged.push(rl);
  }
  return merged;
};

/**
 * Merges user-provided legends with auto-generated ones, matching only by
 * exact `id`. Unlike `mergeLegends`, this never falls back to positional
 * pairing — used by proportionalCircles, where the resolved legend (the
 * "Circle size = ..." size legend) is conceptually a *separate*, additional
 * legend rather than something to graft onto whatever the user's first
 * unrelated legend happens to be. Without this, a user legend that has no
 * `colorBy` of its own (e.g. a bare `{ id: 'custom-legend', title: '...' }`)
 * gets its `colorBy` clobbered by the size legend's `colorBy` whenever there
 * is exactly one resolved legend — silently merging two unrelated legends
 * into one and losing the "Circle size = ..." entry entirely.
 */
export const mergeLegendsByIdOnly = (
  userLegends: LegendSpec[],
  resolvedLegends: LegendSpec[]
): LegendSpec[] => {
  const usedIds = new Set<string>();
  const merged = userLegends.map((userLegend) => {
    const match = resolvedLegends.find((r) => {
      return r.id === userLegend.id;
    });
    if (!match) return userLegend;
    usedIds.add(match.id);
    if (!match.colorBy) return userLegend;
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
  // `usedIds` already covers every resolved id a user legend could share,
  // because the match above is an exact id lookup across all of
  // `resolvedLegends` — a resolved id can never end up in `merged` without
  // also landing in `usedIds`.
  for (const rl of resolvedLegends) {
    if (usedIds.has(rl.id)) continue;
    merged.push(rl);
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
  resolved: ResolvedResult,
  legendMerge: (
    userLegends: LegendSpec[],
    resolvedLegends: LegendSpec[]
  ) => LegendSpec[] = mergeLegends
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
        ? legendMerge(userLegends, resolved.legends)
        : resolved.legends,
    // Mark as resolved so resolveSpecFromMapType is idempotent on already-resolved
    // specs — the GeoVisProvider + runtime both call it, and this avoids a
    // duplicate resolveSpecFromMapType on every control change.
    __resolved: true,
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
  if (!spec.mapType || spec.__resolved) return spec;

  if (spec.mapType === 'proportionalCircles') {
    const resolved = resolveProportionalCircles(spec);
    return applyResolved(spec, resolved, mergeLegendsByIdOnly);
  }

  if (spec.mapType === 'dotDensity') {
    const resolved = resolveDotDensity(spec);
    return applyResolved(spec, resolved);
  }

  if (spec.mapType !== 'choropleth') return spec;

  const resolved = resolveChoropleth(spec);
  return applyResolved(spec, resolved);
};
