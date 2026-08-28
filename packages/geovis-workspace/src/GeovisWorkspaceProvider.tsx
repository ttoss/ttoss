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
   * Called with the full next selection whenever a variation is chosen (or the
   * timeline advances). Use it to rebuild the `visualizationSpec` in the parent.
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
  /**
   * Whether the left sidebar is open. Provide it to control the open state
   * from the parent (as `GeovisWorkspace` does, so it can shift the map's
   * layer control clear of the open sidebar). Omit it to let the provider
   * manage the state internally (seeded from `config.leftSidebar.initialState`).
   */
  isLeftSidebarOpen?: boolean;
  /**
   * Called with the next open state whenever the left sidebar is opened or
   * closed. Pair it with `isLeftSidebarOpen` to control the open state.
   */
  onLeftSidebarOpenChange?: (open: boolean) => void;
  /**
   * Whether the right sidebar is open. Provide it to control the open state
   * from the parent (as `GeovisWorkspace` does, so it can shift a right-anchored
   * legend clear of the open sidebar). Omit it to let the provider manage the
   * state internally (seeded from `config.rightSidebar.initialState`).
   */
  isRightSidebarOpen?: boolean;
  /**
   * Called with the next open state whenever the right sidebar is opened or
   * closed. Pair it with `isRightSidebarOpen` to control the open state.
   */
  onRightSidebarOpenChange?: (open: boolean) => void;
}

/**
 * Builds the initial selection from the left sidebar's `variations` sections:
 * each seeds `selection[menuId]` with its `defaultValue`. Timeline filters are
 * intentionally NOT seeded here — `useTimeline` publishes a timeline's default
 * to the shared selection on mount, so seeding it here would suppress that
 * publish and leave uncontrolled consumers unaware of the initial value.
 * Use it to seed the parent's selection state when controlling the workspace.
 */
export const getInitialSelection = ({
  config,
}: {
  config: GeovisWorkspaceConfig;
}): GeovisWorkspaceSelection => {
  const selection: GeovisWorkspaceSelection = {};

  for (const section of config.leftSidebar?.sections ?? []) {
    const { body } = section;

    if (body.kind === 'variations') {
      selection[body.menuId] = body.defaultValue;
    }
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
  isLeftSidebarOpen: leftSidebarOpenProp,
  onLeftSidebarOpenChange,
  isRightSidebarOpen: rightSidebarOpenProp,
  onRightSidebarOpenChange,
}: GeovisWorkspaceProviderProps) => {
  const isControlled = selection !== undefined;

  const [internalSelection, setInternalSelection] =
    React.useState<GeovisWorkspaceSelection>(() => {
      return getInitialSelection({ config });
    });

  const currentSelection = isControlled ? selection : internalSelection;

  const isLeftControlled = leftSidebarOpenProp !== undefined;

  const [internalLeftSidebarOpen, setInternalLeftSidebarOpen] = React.useState(
    () => {
      return config.leftSidebar?.initialState === 'open';
    }
  );

  const isLeftSidebarOpen = isLeftControlled
    ? leftSidebarOpenProp
    : internalLeftSidebarOpen;

  const isRightControlled = rightSidebarOpenProp !== undefined;

  const [internalRightSidebarOpen, setInternalRightSidebarOpen] =
    React.useState(() => {
      return config.rightSidebar?.initialState === 'open';
    });

  const isRightSidebarOpen = isRightControlled
    ? rightSidebarOpenProp
    : internalRightSidebarOpen;

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
      if (!isLeftControlled) {
        setInternalLeftSidebarOpen(open);
      }

      onLeftSidebarOpenChange?.(open);
    },
    [isLeftControlled, onLeftSidebarOpenChange]
  );

  const setRightSidebarOpen = React.useCallback(
    ({ open }: { open: boolean }) => {
      if (!isRightControlled) {
        setInternalRightSidebarOpen(open);
      }

      onRightSidebarOpenChange?.(open);
    },
    [isRightControlled, onRightSidebarOpenChange]
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
