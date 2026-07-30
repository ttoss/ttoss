import type { MapClickInfo, RepairOption } from '@ttoss/geovis';
import * as React from 'react';

export interface GeovisWorkspaceMenuItem {
  /** Value reported through selection and onSelect when this item is active. */
  value: string;
  /** Text shown for the item in the sidebar menu. */
  label: string;
}

export interface GeovisWorkspaceMenu {
  /** Unique identifier of the menu group. */
  id: string;
  /** Title displayed above the group's items. */
  title: string;
  /** Selectable items within the group. */
  items: GeovisWorkspaceMenuItem[];
  /** Value of the item selected by default in this group. */
  defaultValue?: string;
}

export interface GeovisWorkspaceSource {
  /** Source description text. */
  label: string;
  /** Optional URL — when set, the label becomes an external link. */
  href?: string;
}

export interface GeovisWorkspaceSources {
  /** Optional heading rendered above the source list. */
  title?: string;
  /** One entry per data source. */
  items: GeovisWorkspaceSource[];
}

/**
 * The closed, versioned vocabulary of panel regions a workspace composes.
 * Adding a name is additive; renaming one is breaking (ADR-0002).
 */
export type GeovisWorkspaceSlotName =
  'map' | 'legend' | 'warnings' | 'inspector' | 'metadata' | 'controls';

export interface GeovisWorkspaceSlotConfig {
  /**
   * Replaces the slot's default panel. Renders inside the same provider
   * tree, so it gets runtime access through the public contexts exactly
   * like the default it replaces.
   */
  component?: React.ComponentType;
  /** Hides the slot's region entirely instead of rendering its default. */
  hidden?: boolean;
}

export interface GeovisWorkspaceControls {
  /** Menu groups rendered by the `controls` slot's default panel. */
  menus: GeovisWorkspaceMenu[];
}

export interface GeovisWorkspaceLegendConfig {
  /** Descriptive paragraph rendered above the legend. */
  description?: string;
  /** Data sources, each optionally rendered as an external link. */
  sources?: GeovisWorkspaceSources;
}

export interface GeovisWorkspaceSidebarState {
  /** Whether the sidebar starts open or closed. Defaults to `'closed'`. */
  initialState?: 'open' | 'closed';
}

export interface GeovisWorkspaceLeftSidebarState extends GeovisWorkspaceSidebarState {
  /**
   * Menu groups rendered by the `controls` slot's default panel — a
   * convenience alias for `controls.menus` so the left sidebar can be
   * configured in one place. When both are set, `controls.menus` wins.
   */
  menus?: GeovisWorkspaceMenu[];
}

/**
 * Loading/error/data snapshot handed to
 * {@link GeovisWorkspaceRightSidebarState.renderDetails}, derived from the
 * `onFeatureSelect` promise for the current map click.
 */
export interface GeovisWorkspaceDetailState {
  /** `true` while `onFeatureSelect` is in flight. */
  loading: boolean;
  /** Error thrown or rejected by `onFeatureSelect`, or `null`. */
  error: unknown;
  /**
   * Value resolved by `onFeatureSelect`; `null` before the first resolve or
   * when it resolves to `null`. Typed `unknown` — narrow it inside
   * `renderDetails`.
   */
  data: unknown;
}

export interface GeovisWorkspaceRightSidebarState extends GeovisWorkspaceSidebarState {
  /** Title displayed at the top of the right sidebar. */
  title?: string;
  /**
   * Gate deciding whether a map click drives the inspector: return `false` to
   * silently ignore the click (the sidebar keeps its current detail and open
   * state). When omitted, every click is accepted. Pairs with
   * `onFeatureSelect`.
   */
  shouldOpen?: (info: MapClickInfo) => boolean;
  /**
   * Fetches the detail data for the clicked feature. Its promise drives the
   * `loading`/`error`/`data` state handed to `renderDetails`. When set, an
   * accepted click also opens the right sidebar.
   */
  onFeatureSelect?: (info: MapClickInfo) => Promise<unknown>;
  /**
   * Renders the `inspector` slot's content from the current fetch state,
   * replacing the built-in inspector panel when set.
   */
  renderDetails?: (state: GeovisWorkspaceDetailState) => React.ReactNode;
}

export interface GeovisWorkspaceConfig {
  /** Per-slot overrides or hides. Omit an entry to use the slot's default. */
  slots?: Partial<Record<GeovisWorkspaceSlotName, GeovisWorkspaceSlotConfig>>;
  /** Content for the `controls` slot's default panel. */
  controls?: GeovisWorkspaceControls;
  /** Content for the `legend` slot's default panel. */
  legend?: GeovisWorkspaceLegendConfig;
  /** Left sidebar (hosts the `controls` slot) menus and open/closed state. */
  leftSidebar?: GeovisWorkspaceLeftSidebarState;
  /** Right sidebar (hosts legend/warnings/inspector/metadata) title, open/closed state, and detail API. */
  rightSidebar?: GeovisWorkspaceRightSidebarState;
}

/** Active item value per menu group, keyed by menu id. */
export type GeovisWorkspaceSelection = Record<string, string | undefined>;

export interface GeovisWorkspaceContextValue {
  /** The config that drives the sidebars. */
  config: GeovisWorkspaceConfig;
  /** Active item value per menu group, keyed by menu id. */
  selection: GeovisWorkspaceSelection;
  /** Sets the active item for a given menu group. */
  setSelection: ({ menuId, value }: { menuId: string; value: string }) => void;
  /** Whether the left sidebar is currently open. */
  isLeftSidebarOpen: boolean;
  /** Opens or closes the left sidebar. */
  setLeftSidebarOpen: ({ open }: { open: boolean }) => void;
  /** Whether the right sidebar is currently open. */
  isRightSidebarOpen: boolean;
  /** Opens or closes the right sidebar. */
  setRightSidebarOpen: ({ open }: { open: boolean }) => void;
  /** Called with the chosen `RepairOption` when a repair button is pressed. */
  onRepair?: (repair: RepairOption) => void;
  /**
   * Called with a layer's id and its next `visible` value when the
   * `LayerListControls` `controls` slot variant toggles it. Only the
   * application can rebuild `visualizationSpec` with the new value — the
   * same delegation shape `onRepair`/`onVariableChange` already use, since
   * `SpecPatch`'s `'layer'` target only supports `paint` properties, not
   * arbitrary layer fields like `visible`.
   */
  onLayerVisibilityChange?: (layerId: string, visible: boolean) => void;
  /**
   * Whether `useGeoVis().result` has ever been `'resolved'` since this
   * workspace mounted. Shared through context (rather than each consumer
   * tracking it independently) so slots that mount only once there is
   * content — like the `warnings` panel — see the same history as slots
   * that are always mounted, such as `map`.
   */
  hasResolvedOnce: boolean;
}

export const GeovisWorkspaceContext = React.createContext<
  GeovisWorkspaceContextValue | undefined
>(undefined);
