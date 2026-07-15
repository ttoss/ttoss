import { applyMapDataPatchToSpec } from '../spec/mapDataPatch';
import { resolveSpecFromMapType } from '../spec/mapTypeDefaults';
import type { GeoVisResult } from '../spec/result';
import { resolveOverallStatus } from '../spec/result';
import type {
  DataSource,
  VisualizationLayer,
  VisualizationSpec,
} from '../spec/types';
import { validateSpec } from '../spec/validateSpec';
import type { ActionLogEntry, GeoVisAction, GeoVisSelection } from './action';
import type {
  EngineAdapter,
  MountedView,
  SetViewOptions,
  SpecPatch,
  SpecPatchTarget,
} from './adapter';
import { buildContextPacket, type ContextPacket } from './contextPacket';
import { compileAction } from './dispatchAction';

export interface GeoVisRuntime {
  readonly spec: VisualizationSpec;
  /** The `GeoVisResult` of the last `update`/`applyPatch` call (or the initial spec's validation). */
  readonly result: GeoVisResult;
  mount(container: HTMLElement, viewId: string): MountedView;
  /** Validates `spec` first; on failure the adapter is never called and `spec`/`result` are unchanged. */
  update(spec: VisualizationSpec): GeoVisResult;
  /** Validates the patched spec first; on failure the adapter is never called and `spec`/`result` are unchanged. */
  applyPatch(patch: SpecPatch): GeoVisResult;
  /** Imperatively moves the camera and syncs `spec.view`. Animated by default. */
  setView(options: SetViewOptions): void;
  /**
   * Validates and compiles a closed, typed `GeoVisAction` (ADR-0003) to an
   * existing `SpecPatch`/`update`/`setView` mechanism, applying it only on
   * success. Every call — accepted or rejected — appends one entry to the
   * action log (`getActionLog()`).
   */
  dispatch(action: GeoVisAction): GeoVisResult;
  /** Every dispatched action and its outcome, in dispatch order (ADR-0003 audit substrate). */
  getActionLog(): ReadonlyArray<ActionLogEntry>;
  /** Versioned, read-only, metadata-only summary of the current map (ADR-0004). */
  getContextPacket(): ContextPacket;
  /** The runtime's current selection (set via `dispatch({ type: 'select-feature' })`), or `null`. */
  getSelection(): GeoVisSelection | null;
  destroy(): void;
  getAdapter(): EngineAdapter;
}

/** Mutable runtime state, threaded through the standalone method implementations below. */
interface RuntimeState {
  spec: VisualizationSpec;
  result: GeoVisResult;
  actionLog: ActionLogEntry[];
  selection: GeoVisSelection | null;
}

const VALID_PATCH_TARGETS: SpecPatchTarget[] = ['layer', 'source', 'mapData'];

/** Replaces the top-level `visible` field of one layer, by id. */
const applyLayerVisibleReplace = (
  spec: VisualizationSpec,
  layerId: string,
  value: unknown
): VisualizationSpec => {
  return {
    ...spec,
    layers: spec.layers.map((layer) => {
      return layer.id === layerId
        ? { ...layer, visible: value as boolean }
        : layer;
    }),
  };
};

/**
 * Replaces the top-level `mapDataId` field of one layer, by id — added for
 * `dispatch()`'s `set-map-data` action (PRD-002). Referential validity of
 * the new `mapDataId` (declared entry, source scope) is checked afterwards
 * by the same `validateSpec` pass every patch already goes through.
 */
const applyLayerMapDataIdReplace = (
  spec: VisualizationSpec,
  layerId: string,
  value: unknown
): VisualizationSpec => {
  return {
    ...spec,
    layers: spec.layers.map((layer) => {
      return layer.id === layerId
        ? { ...layer, mapDataId: value as string | undefined }
        : layer;
    }),
  };
};

/**
 * Replaces the top-level `filter` field of one layer, by id — added for
 * `dispatch()`'s `set-filter` action (PRD-002). `value: null` (never
 * `undefined` — see `applyPatchToRuntime`'s no-op guard) omits the field
 * entirely rather than storing a literal `null`, keeping `filter` strictly
 * optional at the type level. Capability gating (`unsupported-data-feature`)
 * is checked afterwards by the same `validateSpec` pass every patch goes through.
 */
const applyLayerFilterReplace = (
  spec: VisualizationSpec,
  layerId: string,
  value: unknown
): VisualizationSpec => {
  return {
    ...spec,
    layers: spec.layers.map((layer) => {
      if (layer.id !== layerId) return layer;
      if (value == null) {
        const { filter: _omit, ...rest } = layer;
        return rest;
      }
      return { ...layer, filter: value as VisualizationLayer['filter'] };
    }),
  };
};

/** Replaces one `paint` property of one layer, by id. */
const applyLayerPaintReplace = (
  spec: VisualizationSpec,
  layerId: string,
  prop: string,
  value: unknown
): VisualizationSpec => {
  return {
    ...spec,
    layers: spec.layers.map((layer) => {
      if (layer.id !== layerId) return layer;
      return {
        ...layer,
        paint: {
          ...((layer.paint as Record<string, unknown>) ?? {}),
          [prop]: value,
        },
      };
    }),
  };
};

/** Top-level (non-`paint`) layer fields `dispatch()` actions can replace, by path segment. */
const LAYER_TOP_LEVEL_FIELD_APPLIERS: Record<
  string,
  (
    spec: VisualizationSpec,
    layerId: string,
    value: unknown
  ) => VisualizationSpec
> = {
  visible: applyLayerVisibleReplace,
  mapDataId: applyLayerMapDataIdReplace,
  filter: applyLayerFilterReplace,
};

/**
 * Resolves a `replace` patch's path to the right layer-field mutation. No-op
 * for unrecognised shapes. Supports two path depths: a top-level field
 * (`layer.<id>.visible` / `.mapDataId` / `.filter`, 3 parts — one per
 * `dispatch()` action, PRD-002 — see `LAYER_TOP_LEVEL_FIELD_APPLIERS`) and a
 * nested `paint` property (`layer.<id>.paint.<key>`, 4 parts). Split out of
 * `applyLayerPatchToSpec` to keep its complexity low.
 */
const applyLayerReplace = (
  spec: VisualizationSpec,
  path: string,
  value: unknown
): VisualizationSpec => {
  const parts = path.split('.');
  const layerId = parts[1];
  if (!layerId) return spec;
  if (parts.length === 3) {
    const applyField = LAYER_TOP_LEVEL_FIELD_APPLIERS[parts[2] ?? ''];
    return applyField ? applyField(spec, layerId, value) : spec;
  }
  if (parts.length < 4 || parts[2] !== 'paint') return spec;
  const prop = parts[3];
  if (!prop) return spec;
  return applyLayerPaintReplace(spec, layerId, prop, value);
};

/** Applies a layer-targeted patch, returning a new spec reference. No-op for unrecognised patch shapes. */
const applyLayerPatchToSpec = (
  spec: VisualizationSpec,
  patch: SpecPatch & { target: 'layer' }
): VisualizationSpec => {
  if (patch.op === 'add' && patch.value != null) {
    return {
      ...spec,
      layers: [...spec.layers, patch.value as VisualizationLayer],
    };
  }
  if (patch.op === 'remove') {
    const layerId = patch.value as string;
    return {
      ...spec,
      layers: spec.layers.filter((l) => {
        return l.id !== layerId;
      }),
    };
  }
  if (patch.op !== 'replace') return spec;
  return applyLayerReplace(spec, patch.path, patch.value);
};

/** Applies a source-targeted patch; on `remove`, prunes layers that reference the removed source. */
const applySourcePatchToSpec = (
  spec: VisualizationSpec,
  patch: SpecPatch & { target: 'source' }
): VisualizationSpec => {
  if (patch.op === 'add' && patch.value != null) {
    return {
      ...spec,
      sources: [...spec.sources, patch.value as DataSource],
    };
  }
  if (patch.op !== 'remove') return spec;
  const sourceId = patch.value as string;
  return {
    ...spec,
    layers: spec.layers.filter((l) => {
      return l.sourceId !== sourceId;
    }),
    sources: spec.sources.filter((s) => {
      return s.id !== sourceId;
    }),
  };
};

/** Computes the candidate spec a patch would produce, without touching the adapter. */
const computePatchedSpec = (
  currentSpec: VisualizationSpec,
  patch: SpecPatch
): VisualizationSpec => {
  if (patch.target === 'layer') {
    return applyLayerPatchToSpec(
      currentSpec,
      patch as SpecPatch & { target: 'layer' }
    );
  }
  if (patch.target === 'source') {
    return applySourcePatchToSpec(
      currentSpec,
      patch as SpecPatch & { target: 'source' }
    );
  }
  return applyMapDataPatchToSpec(currentSpec, patch);
};

/** Builds the failure result for a patch whose `target` isn't `layer`/`source`/`mapData`. */
const buildUnsupportedPatchTargetResult = (patch: SpecPatch): GeoVisResult => {
  return {
    status: 'unsupported',
    issues: [
      {
        code: 'unsupported-patch-target',
        subject: { path: 'patch.target' },
        message: `Unrecognised patch target "${
          (patch as { target: unknown }).target
        }". Supported targets: layer, source, mapData. Use runtime.update() for view/style changes.`,
        repair: [
          {
            kind: 'allowed-values',
            path: 'patch.target',
            values: VALID_PATCH_TARGETS,
          },
        ],
      },
    ],
  };
};

/**
 * Mounts the current spec, or a no-op view if it never validated.
 * Nothing renders on failure (ADR-0001): a spec that never passed
 * `validateSpec` is rejected before mount rather than handed to the adapter.
 */
const mountRuntime = (
  adapter: EngineAdapter,
  state: RuntimeState,
  container: HTMLElement,
  viewId: string
): MountedView => {
  if (state.result.status !== 'resolved') {
    return { viewId, container, destroy: () => {} };
  }
  return adapter.mount(container, state.spec, viewId);
};

/** Validates `spec` and, only on success, commits it and forwards to `adapter.update`. */
const updateRuntime = (
  adapter: EngineAdapter,
  state: RuntimeState,
  spec: VisualizationSpec
): GeoVisResult => {
  const resolved = resolveSpecFromMapType(spec);
  const result = validateSpec(resolved, adapter.getCapabilities());
  state.result = result;
  if (result.status === 'resolved') {
    state.spec = result.spec;
    adapter.update(state.spec);
  }
  return result;
};

/** Validates the patch's candidate spec and, only on success, commits it and forwards to `adapter.applyPatch`. */
const applyPatchToRuntime = (
  adapter: EngineAdapter,
  state: RuntimeState,
  patch: SpecPatch
): GeoVisResult => {
  // replace with undefined value is a no-op; report the unchanged state.
  if (patch.op === 'replace' && patch.value === undefined) {
    return state.result;
  }

  if (!VALID_PATCH_TARGETS.includes(patch.target)) {
    const result = buildUnsupportedPatchTargetResult(patch);
    state.result = result;
    return result;
  }

  const candidateSpec = computePatchedSpec(state.spec, patch);
  const result = validateSpec(candidateSpec, adapter.getCapabilities());
  state.result = result;
  if (result.status === 'resolved') {
    state.spec = result.spec;
    adapter.applyPatch?.(patch);
  }
  return result;
};

/** Moves the adapter's camera and merges the defined fields into `state.spec.view`. */
const setRuntimeView = (
  adapter: EngineAdapter,
  state: RuntimeState,
  options: SetViewOptions
): void => {
  const { animate: _a, ...cameraFields } = options;
  const definedFields = Object.fromEntries(
    Object.entries(cameraFields).filter(([, v]) => {
      return v !== undefined;
    })
  );
  if (Object.keys(definedFields).length === 0) return;
  adapter.setView(options);
  const prevView = state.spec.view ?? {};
  const nextView = { ...prevView, ...definedFields };
  state.spec = { ...state.spec, view: nextView };
};

/**
 * Compiles `action` against the current spec to one of four outcomes:
 * - a `SpecPatch` — applied through `applyPatchToRuntime`, validating and
 *   committing exactly like a hand-written patch would;
 * - a selection update — runtime-level ephemeral state, committed directly
 *   and forwarded to `adapter.setSelection`, never touching `state.spec`;
 * - a camera move — forwarded to `setRuntimeView`, the same mechanism
 *   `runtime.setView()` already uses;
 * - a rejection issue — built into the failure result directly.
 * Every call appends one entry to `state.actionLog`, accepted or rejected
 * (ADR-0003 audit substrate).
 */
const dispatchToRuntime = (
  adapter: EngineAdapter,
  state: RuntimeState,
  action: GeoVisAction
): GeoVisResult => {
  const outcome = compileAction(state.spec, action);
  let result: GeoVisResult;
  if ('issue' in outcome) {
    result = {
      status: resolveOverallStatus([outcome.issue]),
      issues: [outcome.issue],
    };
    state.result = result;
  } else if ('selection' in outcome) {
    state.selection = outcome.selection;
    adapter.setSelection?.(outcome.selection);
    result = state.result;
  } else if ('setViewOptions' in outcome) {
    setRuntimeView(adapter, state, outcome.setViewOptions);
    result = state.result;
  } else {
    result = applyPatchToRuntime(adapter, state, outcome.patch);
  }
  state.actionLog.push({ action, result, timestamp: Date.now() });
  return result;
};

/**
 * Creates a new, isolated GeoVis runtime that mediates between a `VisualizationSpec`
 * and a concrete `EngineAdapter`. Spec updates are immutable (spread + replace) so
 * adapters and hooks can use reference equality as a cheap change-detection signal.
 *
 * `update`/`applyPatch` validate the candidate spec against `validateSpec` (using
 * the adapter's declared `CapabilitySet`) before touching the adapter or
 * `state.spec` — on failure, nothing renders and nothing mutates: the adapter
 * is never called, `spec` keeps its last accepted value, and the caller gets a
 * `GeoVisResult` describing why (ADR-0001).
 */
export const createRuntime = (
  adapter: EngineAdapter,
  initialSpec: VisualizationSpec
): GeoVisRuntime => {
  const initialResolved = resolveSpecFromMapType(initialSpec);
  const initialResult = validateSpec(
    initialResolved,
    adapter.getCapabilities()
  );
  const state: RuntimeState = {
    spec:
      initialResult.status === 'resolved'
        ? initialResult.spec
        : initialResolved,
    result: initialResult,
    actionLog: [],
    selection: null,
  };

  return {
    get spec() {
      return state.spec;
    },
    get result() {
      return state.result;
    },
    mount: (container, viewId) => {
      return mountRuntime(adapter, state, container, viewId);
    },
    update: (spec) => {
      return updateRuntime(adapter, state, spec);
    },
    applyPatch: (patch) => {
      return applyPatchToRuntime(adapter, state, patch);
    },
    setView: (options) => {
      setRuntimeView(adapter, state, options);
    },
    dispatch: (action) => {
      return dispatchToRuntime(adapter, state, action);
    },
    getActionLog: () => {
      return state.actionLog;
    },
    getContextPacket: () => {
      return buildContextPacket(
        state.spec,
        state.result,
        state.selection,
        adapter.getCapabilities()
      );
    },
    getSelection: () => {
      return state.selection;
    },
    destroy: () => {
      adapter.destroy();
    },
    getAdapter: () => {
      return adapter;
    },
  };
};
