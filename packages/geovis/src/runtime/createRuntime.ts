import { applyMapDataPatchToSpec } from '../spec/mapDataPatch';
import { resolveSpecFromMapType } from '../spec/mapTypeDefaults';
import type { GeoVisResult } from '../spec/result';
import type {
  DataSource,
  VisualizationLayer,
  VisualizationSpec,
} from '../spec/types';
import { validateSpec } from '../spec/validateSpec';
import type {
  EngineAdapter,
  MountedView,
  SetViewOptions,
  SpecPatch,
  SpecPatchTarget,
} from './adapter';

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
  destroy(): void;
  getAdapter(): EngineAdapter;
}

/** Mutable runtime state, threaded through the standalone method implementations below. */
interface RuntimeState {
  spec: VisualizationSpec;
  result: GeoVisResult;
}

const VALID_PATCH_TARGETS: SpecPatchTarget[] = ['layer', 'source', 'mapData'];

/** Applies a layer-targeted patch, returning a new spec reference. No-op for unrecognised path shapes. */
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
  const parts = patch.path.split('.');
  if (parts.length < 4 || parts[2] !== 'paint') return spec;
  const layerId = parts[1];
  const prop = parts[3];
  if (!layerId || !prop) return spec;
  return {
    ...spec,
    layers: spec.layers.map((layer) => {
      if (layer.id !== layerId) return layer;
      return {
        ...layer,
        paint: {
          ...((layer.paint as Record<string, unknown>) ?? {}),
          [prop]: patch.value,
        },
      };
    }),
  };
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
    destroy: () => {
      adapter.destroy();
    },
    getAdapter: () => {
      return adapter;
    },
  };
};
