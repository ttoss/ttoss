import type { VisualizationSpec } from '../spec/types';

export interface EngineAdapter {
  id: 'maplibre' | 'deckgl';
  getCapabilities(): CapabilitySet;
  mount(
    container: HTMLElement,
    spec: VisualizationSpec,
    viewId: string
  ): MountedView;
  update(spec: VisualizationSpec): void;
  applyPatch?(patch: SpecPatch): void;
  destroy(): void;
  getNativeInstance(): unknown;
}

export interface MountedView {
  viewId: string;
  container: HTMLElement;
  destroy(): void;
}

export interface CapabilitySet {
  supports3D: boolean;
  supportsRaster: boolean;
  supportsVectorTiles: boolean;
  supportsCustomLayers: boolean;
}

export interface SpecPatch {
  target: 'layer' | 'source' | 'view' | 'style';
  op: 'replace' | 'add' | 'remove';
  path: string;
  value?: unknown;
  rationale?: string;
}
