import type { MapClickInfo } from '@ttoss/geovis';
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

export interface GeovisWorkspaceLeftSidebar {
  /** Menu groups rendered in the left sidebar. */
  menus: GeovisWorkspaceMenu[];
  /** Whether the sidebar starts open or closed. Defaults to `'closed'`. */
  initialState?: 'open' | 'closed';
}

export interface GeovisWorkspaceLegendItem {
  /** Swatch fill color (any CSS color string or theme color token). */
  color: string;
  /** Text shown next to the swatch, e.g. a value range like "0% – 5%". */
  label: string;
}

export interface GeovisWorkspaceLegend {
  /** Optional heading rendered above the legend swatches. */
  title?: string;
  /** One entry per legend class. */
  items: GeovisWorkspaceLegendItem[];
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

export interface GeovisWorkspaceLegendWithColor {
  /** Descriptive paragraph rendered under the right sidebar title. */
  description?: string;
  /** Color legend (a swatch and label per class). */
  legend?: GeovisWorkspaceLegend;
  /** Data sources, each optionally rendered as an external link. */
  sources?: GeovisWorkspaceSources;
}

export interface GeovisWorkspaceDetailsState {
  /** The clicked feature these details describe, or `null` when cleared. */
  feature: MapClickInfo | null;
  /**
   * Value resolved by `onFeatureSelect`. `null` while the request is in
   * flight, when it failed, or when the selection was cleared. Typed as
   * `unknown` — narrow it inside `renderDetails`.
   */
  data: unknown;
  /** `true` while `onFeatureSelect` is in flight. */
  loading: boolean;
  /** Error thrown/rejected by `onFeatureSelect`, or `null`. */
  error: unknown;
}

export interface GeovisWorkspaceRightSidebar {
  /** Title displayed at the top of the right sidebar. */
  title?: string;
  /** Color legend panel: description, class swatches and data sources. */
  legendWithColor?: GeovisWorkspaceLegendWithColor;
  /** Whether the sidebar starts open or closed. Defaults to `'closed'`. */
  initialState?: 'open' | 'closed';
  /**
   * Fetches details for a feature clicked on the map. The workspace calls it
   * with the clicked feature, opens the right sidebar, and tracks the
   * loading/error/data state — exposed to `renderDetails`. Requires the clicked
   * layer to be click-trackable (it declares `activeLegendId` or `click` in the
   * `visualizationSpec`).
   */
  onFeatureSelect?: (info: MapClickInfo) => Promise<unknown> | unknown;
  /**
   * Renders the details of the clicked feature inside the right sidebar. Called
   * with the current fetch state so it can render loading, error and data. Only
   * used alongside `onFeatureSelect`.
   */
  renderDetails?: (state: GeovisWorkspaceDetailsState) => React.ReactNode;
}

export interface GeovisWorkspaceConfig {
  /** Configuration for the left sidebar. Omit to hide it entirely. */
  leftSidebar?: GeovisWorkspaceLeftSidebar;
  /** Configuration for the right sidebar. Omit to hide it entirely. */
  rightSidebar?: GeovisWorkspaceRightSidebar;
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
  /**
   * Fetch state for the feature currently clicked on the map, or `null` when
   * no feature is selected (or `onFeatureSelect` is not configured).
   */
  details: GeovisWorkspaceDetailsState | null;
  /**
   * Runs `rightSidebar.onFeatureSelect` for the given feature (opening the
   * sidebar and tracking loading/error/data), or clears the details when
   * called with `null`. Wired to map clicks by the workspace.
   */
  selectFeature: (info: MapClickInfo | null) => void;
}

export const GeovisWorkspaceContext = React.createContext<
  GeovisWorkspaceContextValue | undefined
>(undefined);
