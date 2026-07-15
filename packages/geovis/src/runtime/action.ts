import type { GeoVisResult } from '../spec/result';

/**
 * Closed, typed vocabulary of semantic operations `GeoVisRuntime.dispatch()`
 * accepts (ADR-0003, PRD-002). Every variant targets the map through a
 * stable spec id — the same ids `getContextPacket()` names — never a raw
 * `SpecPatch` path or engine expression. Grows one variant per PRD-002
 * phase; currently: `toggle-layer`.
 */
export type GeoVisAction = ToggleLayerAction;

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
