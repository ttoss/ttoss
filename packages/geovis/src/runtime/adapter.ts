import type { LngLat, VisualizationSpec } from '../spec/types';

/**
 * Options accepted by `EngineAdapter.setView` and `GeoVisRuntime.setView`.
 * All camera fields are optional — only provided values are applied.
 * When `animate` is true (default) the adapter uses a smooth flyTo transition;
 * when false it uses an instant jumpTo.
 */
export interface SetViewOptions {
  center?: LngLat;
  zoom?: number;
  pitch?: number;
  bearing?: number;
  /** Whether to animate the transition. Defaults to `true`. */
  animate?: boolean;
}

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
  /** Imperatively moves the camera. Animated by default. */
  setView(options: SetViewOptions): void;
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

/**
 * The set of targets recognised by `applyPatch` at runtime.
 * `'view'` and `'style'` mutations must be applied via `runtime.update(spec)`,
 * not via `applyPatch` — they are intentionally excluded here so callers
 * receive a compile-time error instead of a silent runtime warning.
 */
export type SpecPatchTarget = 'layer' | 'source' | 'mapData';

export type SpecPatch =
  | {
      target: SpecPatchTarget;
      op: 'replace';
      path: string;
      value?: unknown;
      rationale?: string;
    }
  | {
      target: SpecPatchTarget;
      op: 'add' | 'remove';
      path?: string;
      value?: unknown;
      rationale?: string;
    };
