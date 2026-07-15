import type { RepairOption } from '@ttoss/geovis';
import * as React from 'react';

import {
  type GeovisWorkspaceConfig,
  GeovisWorkspaceContext,
  type GeovisWorkspaceSelection,
} from './context/GeovisWorkspaceContext';

export interface GeovisWorkspaceProviderProps {
  /** Content to render inside the provider. */
  children: React.ReactNode;
  /** Config describing the sidebars. */
  config: GeovisWorkspaceConfig;
  /**
   * Active item value per menu group, keyed by menu id. Provide it to control
   * the selection from the parent. Omit it to let the provider manage the
   * selection internally (seeded from each menu's `defaultValue`).
   */
  selection?: GeovisWorkspaceSelection;
  /**
   * Called with the full next selection whenever an item in a menu group is
   * selected. Use it to rebuild the `visualizationSpec` in the parent.
   */
  onSelectionChange?: (selection: GeovisWorkspaceSelection) => void;
  /**
   * Called with the chosen `RepairOption` when a repair button is pressed in
   * the `warnings` slot's default panel. Omit to render repair buttons
   * disabled rather than absent.
   */
  onRepair?: (repair: RepairOption) => void;
  /**
   * Whether the GeoVis runtime has ever resolved successfully. Computed by
   * `GeovisWorkspace` (which has runtime access) and forwarded here so it
   * reaches context; defaults to `false` for standalone usage without a
   * GeoVis runtime.
   */
  hasResolvedOnce?: boolean;
}

/**
 * Builds the initial selection by reading the `defaultValue` of every menu
 * group in the config. Use it to seed the parent's selection state when
 * controlling the workspace.
 */
export const getInitialSelection = ({
  config,
}: {
  config: GeovisWorkspaceConfig;
}): GeovisWorkspaceSelection => {
  const selection: GeovisWorkspaceSelection = {};

  const menus = config.controls?.menus ?? [];

  for (const menu of menus) {
    selection[menu.id] = menu.defaultValue;
  }

  return selection;
};

/**
 * Provides shared state for GeovisWorkspace and all internal components.
 * Manages the per-group selection (controlled or uncontrolled) and the sidebar
 * open state, exposing them via useGeovisWorkspace.
 */
export const GeovisWorkspaceProvider = ({
  children,
  config,
  selection,
  onSelectionChange,
  onRepair,
  hasResolvedOnce = false,
}: GeovisWorkspaceProviderProps) => {
  const isControlled = selection !== undefined;

  const [internalSelection, setInternalSelection] =
    React.useState<GeovisWorkspaceSelection>(() => {
      return getInitialSelection({ config });
    });

  const currentSelection = isControlled ? selection : internalSelection;

  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = React.useState(() => {
    return config.leftSidebar?.initialState === 'open';
  });

  const [isRightSidebarOpen, setIsRightSidebarOpen] = React.useState(() => {
    return config.rightSidebar?.initialState === 'open';
  });

  const setSelection = React.useCallback(
    ({ menuId, value }: { menuId: string; value: string }) => {
      const next = { ...currentSelection, [menuId]: value };

      if (!isControlled) {
        setInternalSelection(next);
      }

      onSelectionChange?.(next);
    },
    [currentSelection, isControlled, onSelectionChange]
  );

  const setLeftSidebarOpen = React.useCallback(
    ({ open }: { open: boolean }) => {
      setIsLeftSidebarOpen(open);
    },
    []
  );

  const setRightSidebarOpen = React.useCallback(
    ({ open }: { open: boolean }) => {
      setIsRightSidebarOpen(open);
    },
    []
  );

  const value = React.useMemo(() => {
    return {
      config,
      selection: currentSelection,
      setSelection,
      isLeftSidebarOpen,
      setLeftSidebarOpen,
      isRightSidebarOpen,
      setRightSidebarOpen,
      onRepair,
      hasResolvedOnce,
    };
  }, [
    config,
    currentSelection,
    setSelection,
    isLeftSidebarOpen,
    setLeftSidebarOpen,
    isRightSidebarOpen,
    setRightSidebarOpen,
    onRepair,
    hasResolvedOnce,
  ]);

  return (
    <GeovisWorkspaceContext.Provider value={value}>
      {children}
    </GeovisWorkspaceContext.Provider>
  );
};
