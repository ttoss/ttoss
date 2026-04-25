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

/**
 * Creates a new, isolated GeoVis runtime that mediates between a `VisualizationSpec`
 * and a concrete `EngineAdapter`. Spec updates are immutable (spread + replace) so
 * adapters and hooks can use reference equality as a cheap change-detection signal.
 * `applyPatch` forwards to the adapter before updating `currentSpec` so `runtime.spec`
 * always reflects the last successfully accepted adapter state.
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
