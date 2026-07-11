import { log } from '@ttoss/logger';

import { applyMapDataPatchToSpec } from '../spec/mapDataPatch';
import { resolveSpecFromMapType } from '../spec/mapTypeDefaults';
import type {
  DataSource,
  VisualizationLayer,
  VisualizationSpec,
} from '../spec/types';
import type {
  EngineAdapter,
  MountedView,
  SetViewOptions,
  SpecPatch,
} from './adapter';

export interface GeoVisRuntime {
  readonly spec: VisualizationSpec;
  mount(container: HTMLElement, viewId: string): MountedView;
  update(spec: VisualizationSpec): void;
  applyPatch(patch: SpecPatch): void;
  /** Imperatively moves the camera and syncs `spec.view`. Animated by default. */
  setView(options: SetViewOptions): void;
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
  let currentSpec = resolveSpecFromMapType(initialSpec);

  return {
    get spec() {
      return currentSpec;
    },
    mount: (container, viewId) => {
      return adapter.mount(container, currentSpec, viewId);
    },
    update: (spec) => {
      currentSpec = resolveSpecFromMapType(spec);
      adapter.update(currentSpec);
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
      } else {
        log.warn(
          `[geovis] Runtime: unknown patch target "${
            (patch as { target: unknown }).target
          }" — patch was ignored.`
        );
      }
    },
    setView: (options) => {
      const { animate: _a, ...cameraFields } = options;
      const definedFields = Object.fromEntries(
        Object.entries(cameraFields).filter(([, v]) => {
          return v !== undefined;
        })
      );
      if (Object.keys(definedFields).length === 0) return;
      adapter.setView(options);
      const prevView = currentSpec.view ?? {};
      const nextView = { ...prevView, ...definedFields };
      currentSpec = { ...currentSpec, view: nextView };
    },
    destroy: () => {
      adapter.destroy();
    },
    getAdapter: () => {
      return adapter;
    },
  };
};
