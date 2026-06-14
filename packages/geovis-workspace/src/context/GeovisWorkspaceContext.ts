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
}

export interface GeovisWorkspaceRightSidebar {
  /** Title displayed at the top of the right sidebar. */
  title?: string;
}

export interface GeovisWorkspaceSpec {
  /** Configuration for the left sidebar. Omit to hide it entirely. */
  leftSidebar?: GeovisWorkspaceLeftSidebar;
  /** Configuration for the right sidebar. Omit to hide it entirely. */
  rightSidebar?: GeovisWorkspaceRightSidebar;
}

/** Active item value per menu group, keyed by menu id. */
export type GeovisWorkspaceSelection = Record<string, string | undefined>;

export interface GeovisWorkspaceContextValue {
  /** The spec that drives the sidebars. */
  spec: GeovisWorkspaceSpec;
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
}

export const GeovisWorkspaceContext = React.createContext<
  GeovisWorkspaceContextValue | undefined
>(undefined);
