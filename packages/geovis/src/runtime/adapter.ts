import type {
  DataSource,
  GeoVisGeometryType,
  LngLat,
  VisualizationSpec,
} from '../spec/types';
import type { GeoVisSelection } from './action';

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
  /**
   * Applies (or, with `null`, clears) the runtime's current selection —
   * swaps `feature-state.selected` on the live map. Optional: adapters that
   * don't support feature-state selection simply skip this (`dispatch()`
   * still tracks selection at the runtime level either way).
   */
  setSelection?(selection: GeoVisSelection | null): void;
  destroy(): void;
  getNativeInstance(): unknown;
}

export interface MountedView {
  viewId: string;
  container: HTMLElement;
  destroy(): void;
}

/**
 * Structured, introspectable capability tree (ADR-0002). A capability entry
 * may only be `true`/present when an official test or fixture exercises it —
 * "declared means tested". `validateSpec` accepts the active adapter's
 * `CapabilitySet` and rejects anything the spec requires but the adapter does
 * not declare, so an unsupported spec fails before mount instead of
 * rendering partially or misbehaving at the engine level.
 */
export interface CapabilitySet {
  /** Source types the adapter can mount onto the map. */
  sourceTypes: DataSource['type'][];
  /** Layer geometries the adapter can translate and render. */
  layerGeometries: GeoVisGeometryType[];
  /** Data-binding features, scoped to the source types that support them. */
  dataFeatures: {
    /**
     * Source types where per-feature `setFeatureState` joining works — this
     * is what `mapData`, `sizeBy`, and value-driven `colorBy` all depend on.
     */
    featureState: DataSource['type'][];
    /**
     * Source types where a declarative `VisualizationLayer.filter` compiles
     * to a working native engine filter (`dispatch({ type: 'set-filter' })`,
     * PRD-002).
     */
    filter: DataSource['type'][];
  };
  /** Camera/view features. */
  viewFeatures: {
    pitch: boolean;
    bearing: boolean;
  };
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
