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
      adapter.applyPatch?.(patch);
    },
    destroy: () => {
      adapter.destroy();
    },
    getAdapter: () => {
      return adapter;
    },
  };
};
