import * as React from 'react';

import {
  GeovisWorkspaceContext,
  type GeovisWorkspaceSelection,
  type GeovisWorkspaceSpec,
} from './context/GeovisWorkspaceContext';

export interface GeovisWorkspaceProviderProps {
  /** Content to render inside the provider. */
  children: React.ReactNode;
  /** Spec describing the sidebars. */
  spec: GeovisWorkspaceSpec;
  /** Called whenever an item in a menu group is selected. */
  onSelect?: ({ menuId, value }: { menuId: string; value: string }) => void;
}

const getInitialSelection = (
  spec: GeovisWorkspaceSpec
): GeovisWorkspaceSelection => {
  const selection: GeovisWorkspaceSelection = {};

  const menus = spec.leftSidebar?.menus ?? [];

  for (const menu of menus) {
    selection[menu.id] = menu.defaultValue;
  }

  return selection;
};

/**
 * Provides shared state for GeovisWorkspace and all internal components.
 * Manages the per-group selection and sidebar open state, exposing them via
 * useGeovisWorkspace.
 */
export const GeovisWorkspaceProvider = ({
  children,
  spec,
  onSelect,
}: GeovisWorkspaceProviderProps) => {
  const [selection, setSelectionState] =
    React.useState<GeovisWorkspaceSelection>(() => {
      return getInitialSelection(spec);
    });

  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = React.useState(false);

  const [isRightSidebarOpen, setIsRightSidebarOpen] = React.useState(false);

  const setSelection = React.useCallback(
    ({ menuId, value }: { menuId: string; value: string }) => {
      setSelectionState((current) => {
        return { ...current, [menuId]: value };
      });
      onSelect?.({ menuId, value });
    },
    [onSelect]
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
      spec,
      selection,
      setSelection,
      isLeftSidebarOpen,
      setLeftSidebarOpen,
      isRightSidebarOpen,
      setRightSidebarOpen,
    };
  }, [
    spec,
    selection,
    setSelection,
    isLeftSidebarOpen,
    setLeftSidebarOpen,
    isRightSidebarOpen,
    setRightSidebarOpen,
  ]);

  return (
    <GeovisWorkspaceContext.Provider value={value}>
      {children}
    </GeovisWorkspaceContext.Provider>
  );
};
