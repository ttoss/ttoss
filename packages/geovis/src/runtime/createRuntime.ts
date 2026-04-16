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

      // Forward to adapter first so the engine reflects the change.
      adapter.applyPatch?.(patch);

      // Keep currentSpec authoritative for all ops.
      if (patch.target === 'layer') {
        if (patch.op === 'add' && patch.value != null) {
          currentSpec = {
            ...currentSpec,
            layers: [...currentSpec.layers, patch.value as VisualizationLayer],
          };
        } else if (patch.op === 'remove') {
          const layerId = patch.value as string;
          currentSpec = {
            ...currentSpec,
            layers: currentSpec.layers.filter((l) => {
              return l.id !== layerId;
            }),
          };
        } else if (patch.op === 'replace') {
          // path: "layer.<layerId>.paint.<camelCaseKey>"
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
                  ...((layer.paint as Record<string, unknown>) ?? {}),
                  [prop]: patch.value,
                },
              };
            }),
          };
        }
      } else if (patch.target === 'source') {
        if (patch.op === 'add' && patch.value != null) {
          currentSpec = {
            ...currentSpec,
            sources: [...currentSpec.sources, patch.value as DataSource],
          };
        } else if (patch.op === 'remove') {
          const sourceId = patch.value as string;
          currentSpec = {
            ...currentSpec,
            layers: currentSpec.layers.filter((l) => {
              return l.sourceId !== sourceId;
            }),
            sources: currentSpec.sources.filter((s) => {
              return s.id !== sourceId;
            }),
          };
        }
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
