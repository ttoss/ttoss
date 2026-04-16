import type { VisualizationSpec } from '../spec/types';
import type { EngineAdapter, MountedView, SpecPatch } from './adapter';

export interface GeoVisRuntime {
  readonly spec: VisualizationSpec;
  mount(container: HTMLElement, viewId: string): MountedView;
  update(spec: VisualizationSpec): void;
  applyPatch(patch: SpecPatch): void;
  destroy(): void;
  getAdapter(): EngineAdapter;
}

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
      // For replace operations, a missing value is a no-op — don't write
      // undefined into currentSpec or forward it to the adapter.
      if (patch.op === 'replace' && patch.value === undefined) return;
      adapter.applyPatch?.(patch);
      // Keep currentSpec in sync with spec-level paint keys (camelCase)
      if (patch.op !== 'replace' || patch.target !== 'layer') return;
      const parts = patch.path.split('.');
      if (parts.length < 4 || parts[2] !== 'paint') return;
      const layerId = parts[1];
      const prop = parts[3];
      if (!layerId || !prop) return;
      currentSpec = {
        ...currentSpec,
        layers: currentSpec.layers.map((layer) => {
          if (layer.id !== layerId) return layer;
          return {
            ...layer,
            paint: {
              ...((layer.paint ?? {}) as Record<string, unknown>),
              [prop]: patch.value,
            },
          };
        }),
      };
    },
    destroy: () => {
      adapter.destroy();
    },
    getAdapter: () => {
      return adapter;
    },
  };
};
