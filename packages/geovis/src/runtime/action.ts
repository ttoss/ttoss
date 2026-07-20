import type { GeoVisResult } from '../spec/result';
import type { LayerFilter } from '../spec/types';

/**
 * Closed, typed vocabulary of semantic operations `GeoVisRuntime.dispatch()`
 * accepts (ADR-0003, PRD-002). Every variant targets the map through a
 * stable spec id — the same ids `getContextPacket()` names — never a raw
 * `SpecPatch` path or engine expression. Grows one variant per PRD-002
 * phase; currently: `toggle-layer`, `select-feature`, `set-map-data`,
 * `set-filter`, `set-view-preset`.
 */
export type GeoVisAction =
  | ToggleLayerAction
  | SelectFeatureAction
  | SetMapDataAction
  | SetFilterAction
  | SetViewPresetAction;

/** Flips (or explicitly sets) a layer's visibility. */
export interface ToggleLayerAction {
  type: 'toggle-layer';
  /** Id of the layer to toggle — must match `spec.layers[].id`. */
  layerId: string;
  /** Explicit next visibility. Omitted: flips the layer's current visibility. */
  visible?: boolean;
  /** Optional free-text reason, preserved on the action log entry for audit. */
  rationale?: string;
}

/**
 * The runtime's current selection — framework-agnostic, shared by
 * `dispatch({ type: 'select-feature' })` and `getContextPacket()` (ADR-0004).
 * Never carries geometry: `featureId` is the same stable id `mapData` rows
 * and click events already key on.
 */
export interface GeoVisSelection {
  /** Id of the layer the selected feature belongs to — matches `spec.layers[].id`. */
  layerId: string;
  featureId: string | number;
}

/** Selects (or, with `featureId: null`, clears) a feature on a layer. */
export interface SelectFeatureAction {
  type: 'select-feature';
  /** Id of the layer to select on — must match `spec.layers[].id`. */
  layerId: string;
  /** Feature id to select, or `null` to clear the current selection. */
  featureId: string | number | null;
  /** Optional free-text reason, preserved on the action log entry for audit. */
  rationale?: string;
}

/**
 * Rebinds which `MapData` entry drives a layer's data-bound styling —
 * "swap the joined dataset" (ADR-0003). Since a `MapData` entry's own
 * `dimension` ('color' | 'size') travels with it, picking a different entry
 * also swaps which dimension the layer reads, without a separate field.
 */
export interface SetMapDataAction {
  type: 'set-map-data';
  /** Id of the layer whose binding to change — must match `spec.layers[].id`. */
  layerId: string;
  /** Id of the `MapData` entry to bind — must match `spec.mapData[].mapDataId`. */
  mapDataId: string;
  /** Optional free-text reason, preserved on the action log entry for audit. */
  rationale?: string;
}

/**
 * Sets (or, with `filter: null`, clears) a declarative predicate that hides
 * non-matching features on a layer — compiled to the engine's native filter
 * expression. Gated by `CapabilitySet.dataFeatures.filter` per source type.
 */
export interface SetFilterAction {
  type: 'set-filter';
  /** Id of the layer to filter — must match `spec.layers[].id`. */
  layerId: string;
  /** The predicate to apply, or `null` to clear the layer's current filter. */
  filter: LayerFilter | null;
  /** Optional free-text reason, preserved on the action log entry for audit. */
  rationale?: string;
}

/**
 * Moves the camera to a named `ViewPreset` declared in `spec.viewPresets` —
 * bounded to positions the application actually curated, instead of raw
 * coordinates an AI would otherwise have to invent. Compiles to the same
 * `runtime.setView()` mechanism a UI camera control already uses.
 */
export interface SetViewPresetAction {
  type: 'set-view-preset';
  /** Id of the preset to move to — must match `spec.viewPresets[].id`. */
  presetId: string;
  /** Optional free-text reason, preserved on the action log entry for audit. */
  rationale?: string;
}

/**
 * One dispatched action and its outcome, accepted or rejected — the
 * audit/undo substrate PRD-002 requires. Every `dispatch()` call appends
 * exactly one entry, regardless of whether the action was accepted.
 */
export interface ActionLogEntry {
  action: GeoVisAction;
  result: GeoVisResult;
  /** `Date.now()` at dispatch time. */
  timestamp: number;
}
