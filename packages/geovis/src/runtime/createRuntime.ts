import { applyMapDataPatchToSpec } from '../spec/mapDataPatch';
import type {
  DataSource,
  VisualizationLayer,
  VisualizationSpec,
} from '../spec/types';
import type { EngineAdapter, MountedView, SpecPatch } from './adapter';

export interface GeoVisRuntime {
  readonly spec: VisualizationSpec;
  mount(container: HTMLElement, viewId: string): MountedView;
  update(spec: VisualizationSpec): void;
  applyPatch(patch: SpecPatch): void;
  destroy(): void;
  getAdapter(): EngineAdapter;
}

/**
 * Applies a layer-targeted patch to the spec, returning a new spec reference.
 *
 * @remarks
 * Only `add`, `remove`, and `replace` on `layer.<layerId>.paint.<prop>` paths
 * are handled. Any unrecognised path shape is treated as a no-op to avoid partial
 * mutations that would leave the spec in an inconsistent state.
 *
 * Paint is shallow-merged (`{ ...layer.paint, [prop]: value }`) because
 * individual paint keys are independent — a deep merge would risk leaking
 * stale values from a previous spec version.
 */
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

/**
 * Applies a source-targeted patch to the spec, returning a new spec reference.
 *
 * @remarks
 * On `remove`, associated layers that reference the removed source are also
 * pruned. This mirrors the invariant enforced by `validateSpec`: every layer's
 * `sourceId` must resolve to an existing source, so removing a source without
 * removing its dependant layers would produce an invalid spec.
 */
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

/**
 * Creates a new, isolated GeoVis runtime that mediates between a
 * `VisualizationSpec` and a concrete `EngineAdapter`.
 *
 * @remarks
 * The runtime maintains a `currentSpec` closure updated by both `update()` and
 * `applyPatch()`. Updates are applied immutably (spread + replace) so adapter
 * implementations and React hooks can rely on reference equality
 * (`prevSpec !== nextSpec`) as a cheap change-detection signal.
 *
 * `applyPatch` forwards the patch to the adapter **before** updating
 * `currentSpec`. This ensures `runtime.spec` always reflects the last
 * successfully accepted adapter state even if the adapter throws mid-patch.
 *
 * A `replace` patch with `value === undefined` is silently ignored to allow
 * callers to express "clear this property" without special-casing on the
 * call site.
 *
 * @param adapter - The engine adapter to delegate rendering to.
 * @param initialSpec - The starting spec; used to initialise the internal state.
 * @returns A `GeoVisRuntime` handle with `mount`, `update`, `applyPatch`,
 *   and `destroy`.
 *
 * @example
 * ```ts
 * const runtime = createRuntime(createMapLibreAdapter(), mySpec);
 * runtime.mount(containerEl, 'main-view');
 * runtime.applyPatch({ target: 'layer', op: 'add', value: newLayer });
 * runtime.destroy();
 * ```
 */
export const createRuntime = (
  adapter: EngineAdapter,
  initialSpec: VisualizationSpec
): GeoVisRuntime => {
  let currentSpec = initialSpec;

  return {
    get spec() {
      return currentSpec;
    },
    mount: (container, viewId) => {
      return adapter.mount(container, currentSpec, viewId);
    },
    update: (spec) => {
      currentSpec = spec;
      adapter.update(spec);
    },
    applyPatch: (patch) => {
      // replace with undefined value is a no-op.
      if (patch.op === 'replace' && patch.value === undefined) return;
      adapter.applyPatch?.(patch);
      if (patch.target === 'layer') {
        currentSpec = applyLayerPatchToSpec(
          currentSpec,
          patch as SpecPatch & { target: 'layer' }
        );
      } else if (patch.target === 'source') {
        currentSpec = applySourcePatchToSpec(
          currentSpec,
          patch as SpecPatch & { target: 'source' }
        );
      } else if (patch.target === 'mapData') {
        currentSpec = applyMapDataPatchToSpec(currentSpec, patch);
      }
    },
    destroy: () => {
      adapter.destroy();
    },
    getAdapter: () => {
      return adapter;
    },
  };
};
