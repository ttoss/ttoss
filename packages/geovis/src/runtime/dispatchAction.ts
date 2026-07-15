import type { GeoVisIssue } from '../spec/result';
import type { VisualizationSpec } from '../spec/types';
import type { GeoVisAction, ToggleLayerAction } from './action';
import type { SpecPatch } from './adapter';

/**
 * Builds the `unknown-layer-id` issue for an action targeting a `layerId`
 * absent from the current spec, listing every declared layer id as repair —
 * the same shape `unknown-map-data-id`/`unknown-source` already use.
 */
export const buildUnknownLayerIdIssue = (
  spec: VisualizationSpec,
  layerId: string,
  path: string
): GeoVisIssue => {
  return {
    code: 'unknown-layer-id',
    subject: { path, id: layerId },
    message: `action references unknown layer '${layerId}'`,
    repair: [
      {
        kind: 'allowed-values',
        path,
        values: spec.layers.map((l) => {
          return l.id;
        }),
      },
    ],
  };
};

/**
 * Compiles `toggle-layer` to the layer-visibility `SpecPatch` (extends the
 * existing `replace`-on-`layer` mechanism, previously `paint`-only, to a
 * top-level `visible` field — see `createRuntime.ts#applyLayerPatchToSpec`
 * and `patchDispatch.ts#applyLayerVisibleReplace`). Never regenerates the
 * spec: this keeps `dispatch()` as cheap as an equivalent hand-written patch.
 */
const compileToggleLayer = (
  spec: VisualizationSpec,
  action: ToggleLayerAction
): { patch: SpecPatch } | { issue: GeoVisIssue } => {
  const layer = spec.layers.find((l) => {
    return l.id === action.layerId;
  });
  if (!layer) {
    return {
      issue: buildUnknownLayerIdIssue(spec, action.layerId, 'action.layerId'),
    };
  }
  const isCurrentlyVisible = layer.visible !== false;
  const nextVisible = action.visible ?? !isCurrentlyVisible;
  return {
    patch: {
      target: 'layer',
      op: 'replace',
      path: `layer.${action.layerId}.visible`,
      value: nextVisible,
      rationale: action.rationale,
    },
  };
};

/**
 * Compiles a `GeoVisAction` against the current spec to either an existing
 * `SpecPatch`/`setView` mechanism or a rejection issue — never both, and
 * never mutating anything itself (the caller validates and commits).
 */
export const compileAction = (
  spec: VisualizationSpec,
  action: GeoVisAction
): { patch: SpecPatch } | { issue: GeoVisIssue } => {
  switch (action.type) {
    case 'toggle-layer':
      return compileToggleLayer(spec, action);
  }
};
