import type { GeoVisIssue } from '../spec/result';
import type { VisualizationLayer, VisualizationSpec } from '../spec/types';
import type {
  GeoVisAction,
  GeoVisSelection,
  SelectFeatureAction,
  SetMapDataAction,
  ToggleLayerAction,
} from './action';
import type { SpecPatch } from './adapter';

/** What compiling a `GeoVisAction` against the current spec produces. */
export type ActionOutcome =
  | { patch: SpecPatch }
  | { selection: GeoVisSelection | null }
  | { issue: GeoVisIssue };

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
 * Builds the `unknown-feature-id` issue for a `select-feature` action whose
 * `featureId` isn't a row of the layer's joined `mapData` — only checked
 * when the layer declares `mapDataId` (the only case this is cheap: the
 * rows are already loaded, no geometry/engine query needed).
 */
const buildUnknownFeatureIdIssue = (
  layer: VisualizationLayer,
  featureId: string | number,
  allowedFeatureIds: ReadonlyArray<string | number>
): GeoVisIssue => {
  return {
    code: 'unknown-feature-id',
    subject: { path: 'action.featureId', id: String(featureId) },
    message: `layer '${layer.id}' has no mapData row for featureId '${featureId}'`,
    repair: [
      {
        kind: 'allowed-values',
        path: 'action.featureId',
        values: allowedFeatureIds,
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
): ActionOutcome => {
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
 * Compiles `select-feature` to a `GeoVisSelection` update — runtime-level
 * ephemeral state, never part of the spec (selection is not map data).
 * `featureId: null` clears the selection unconditionally, skipping the
 * `layerId` check entirely: clearing "whatever is selected" is always valid,
 * even if the previously-selected layer was since removed from the spec.
 */
const compileSelectFeature = (
  spec: VisualizationSpec,
  action: SelectFeatureAction
): ActionOutcome => {
  if (action.featureId === null) {
    return { selection: null };
  }
  const layer = spec.layers.find((l) => {
    return l.id === action.layerId;
  });
  if (!layer) {
    return {
      issue: buildUnknownLayerIdIssue(spec, action.layerId, 'action.layerId'),
    };
  }
  if (layer.mapDataId) {
    const mapData = spec.mapData?.find((md) => {
      return md.mapDataId === layer.mapDataId;
    });
    if (mapData) {
      const allowedFeatureIds = mapData.data.map((row) => {
        return row.geometryId;
      });
      const exists = allowedFeatureIds.some((id) => {
        return String(id) === String(action.featureId);
      });
      if (!exists) {
        return {
          issue: buildUnknownFeatureIdIssue(
            layer,
            action.featureId,
            allowedFeatureIds
          ),
        };
      }
    }
  }
  return {
    selection: { layerId: action.layerId, featureId: action.featureId },
  };
};

/**
 * Compiles `set-map-data` to the layer's `mapDataId`-rebinding `SpecPatch`
 * (another top-level-field replace on `layer`, alongside `visible` — see
 * `createRuntime.ts#applyLayerReplace`). Only the `layerId` referential
 * check happens here; whether `mapDataId` itself is a declared entry, and
 * whether it shares the layer's source, is left to the same `validateSpec`
 * pass `applyPatchToRuntime` already runs for every patch — reusing the
 * existing `unknown-map-data-id`/`source-scope-conflict` checks rather than
 * duplicating them.
 */
const compileSetMapData = (
  spec: VisualizationSpec,
  action: SetMapDataAction
): ActionOutcome => {
  const layer = spec.layers.find((l) => {
    return l.id === action.layerId;
  });
  if (!layer) {
    return {
      issue: buildUnknownLayerIdIssue(spec, action.layerId, 'action.layerId'),
    };
  }
  return {
    patch: {
      target: 'layer',
      op: 'replace',
      path: `layer.${action.layerId}.mapDataId`,
      value: action.mapDataId,
      rationale: action.rationale,
    },
  };
};

/**
 * Compiles a `GeoVisAction` against the current spec to either an existing
 * `SpecPatch` mechanism, a runtime-level selection update, or a rejection
 * issue — never more than one, and never mutating anything itself (the
 * caller validates and commits).
 */
export const compileAction = (
  spec: VisualizationSpec,
  action: GeoVisAction
): ActionOutcome => {
  switch (action.type) {
    case 'toggle-layer':
      return compileToggleLayer(spec, action);
    case 'select-feature':
      return compileSelectFeature(spec, action);
    case 'set-map-data':
      return compileSetMapData(spec, action);
  }
};
