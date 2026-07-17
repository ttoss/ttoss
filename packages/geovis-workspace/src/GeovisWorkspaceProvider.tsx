import type { MapClickInfo } from '@ttoss/geovis';
import * as React from 'react';

import {
  type GeovisWorkspaceConfig,
  GeovisWorkspaceContext,
  type GeovisWorkspaceDetailsState,
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

  const menus = config.leftSidebar?.menus ?? [];

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

  const [details, setDetails] =
    React.useState<GeovisWorkspaceDetailsState | null>(null);

  // Read the latest callbacks through refs so `selectFeature` stays stable
  // even when the parent recreates `config` on every render.
  const onFeatureSelect = config.rightSidebar?.onFeatureSelect;
  const onFeatureSelectRef = React.useRef(onFeatureSelect);
  React.useEffect(() => {
    onFeatureSelectRef.current = onFeatureSelect;
  }, [onFeatureSelect]);

  const shouldOpen = config.rightSidebar?.shouldOpen;
  const shouldOpenRef = React.useRef(shouldOpen);
  React.useEffect(() => {
    shouldOpenRef.current = shouldOpen;
  }, [shouldOpen]);

  // Monotonic request id: only the response of the latest request wins, so
  // rapid clicks never render a stale (out-of-order) result.
  const requestIdRef = React.useRef(0);

  const selectFeature = React.useCallback(
    (info: MapClickInfo | null) => {
      const fetcher = onFeatureSelectRef.current;

      if (!fetcher) {
        return;
      }

      if (info === null) {
        requestIdRef.current += 1;
        setDetails(null);
        setRightSidebarOpen({ open: false });
        return;
      }

      const guard = shouldOpenRef.current;
      if (guard && !guard(info)) {
        setRightSidebarOpen({ open: false });
        return;
      }

      const requestId = (requestIdRef.current += 1);

      setDetails({ feature: info, data: null, loading: true, error: null });
      setRightSidebarOpen({ open: true });

      Promise.resolve()
        .then(() => {
          return fetcher(info);
        })
        .then((data) => {
          if (requestId !== requestIdRef.current) {
            return;
          }

          setDetails({ feature: info, data, loading: false, error: null });
        })
        .catch((error: unknown) => {
          if (requestId !== requestIdRef.current) {
            return;
          }

          setDetails({ feature: info, data: null, loading: false, error });
        });
    },
    [setRightSidebarOpen]
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
      details,
      selectFeature,
    };
  }, [
    config,
    currentSelection,
    setSelection,
    isLeftSidebarOpen,
    setLeftSidebarOpen,
    isRightSidebarOpen,
    setRightSidebarOpen,
    details,
    selectFeature,
  ]);

  return (
    <GeovisWorkspaceContext.Provider value={value}>
      {children}
    </GeovisWorkspaceContext.Provider>
  );
};
