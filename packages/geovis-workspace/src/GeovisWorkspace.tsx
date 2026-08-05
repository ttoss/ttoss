import type { RepairOption, VisualizationSpec } from '@ttoss/geovis';
import { GeoVisProvider } from '@ttoss/geovis';
import { Box } from '@ttoss/ui';
import * as React from 'react';

import { Layout } from './components/Layout';
import {
  type GeovisWorkspaceConfig,
  type GeovisWorkspaceSelection,
} from './context/GeovisWorkspaceContext';
import { applyLeftSidebarControlOffset } from './controlOffset';
import {
  GeovisWorkspaceProvider,
  type GeovisWorkspaceProviderProps,
} from './GeovisWorkspaceProvider';
import { useHasResolvedOnce } from './hooks/useHasResolvedOnce';

/**
 * Reads whether the GeoVis runtime has ever resolved and forwards it into
 * `GeovisWorkspaceProvider`. Kept as a separate component (rather than
 * inlined in `GeovisWorkspaceProvider`) since that provider is also usable
 * standalone, without a GeoVis runtime — `useGeoVis()` is only safe to call
 * here, inside `GeoVisProvider`.
 */
const GeovisWorkspaceProviderWithRuntime = ({
  children,
  ...providerProps
}: GeovisWorkspaceProviderProps) => {
  const hasResolvedOnce = useHasResolvedOnce();

  return (
    <GeovisWorkspaceProvider
      {...providerProps}
      hasResolvedOnce={hasResolvedOnce}
    >
      {children}
    </GeovisWorkspaceProvider>
  );
};

export interface GeovisWorkspaceProps {
  config: GeovisWorkspaceConfig;
  visualizationSpec: VisualizationSpec;
  variables?: GeovisWorkspaceSelection;
  onVariableChange?: (variables: GeovisWorkspaceSelection) => void;
  /**
   * Called with the chosen `RepairOption` when a repair button is pressed in
   * the `warnings` slot's default panel. Omit to render repair buttons
   * disabled rather than absent.
   */
  onRepair?: (repair: RepairOption) => void;
  /**
   * Called with a layer's id and its next `visible` value when the
   * `LayerListControls` `controls` slot variant toggles it. Rebuild
   * `visualizationSpec` with that layer's `visible` field updated.
   */
  onLayerVisibilityChange?: (layerId: string, visible: boolean) => void;
}

/**
 * Renders the workspace's sidebars and map, all wired to the same GeoVis
 * runtime via `GeoVisProvider` hoisted above this tree.
 */
export const GeovisWorkspace = ({
  config,
  visualizationSpec,
  variables,
  onVariableChange,
  onRepair,
  onLayerVisibilityChange,
}: GeovisWorkspaceProps) => {
  // Owned here (rather than only inside the provider) so the spec fed to
  // `GeoVisProvider` can react to it: while the left sidebar is open the map's
  // layer control is shifted clear of it, since an opening sidebar (z-index 2)
  // otherwise covers the control (z-index 1) that shares its corner.
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = React.useState(() => {
    return config.leftSidebar?.initialState === 'open';
  });

  const spec = React.useMemo(() => {
    return applyLeftSidebarControlOffset({
      spec: visualizationSpec,
      leftSidebarOpen: isLeftSidebarOpen,
    });
  }, [visualizationSpec, isLeftSidebarOpen]);

  return (
    // `GeoVisProvider` auto-mounts any spec legend (or the layer `control`)
    // that declares a `position` as an absolutely-positioned overlay, rendered
    // as a sibling of its `children` and anchored to the nearest positioned
    // ancestor. This Box must therefore *wrap* `GeoVisProvider` — not sit
    // inside it — so it becomes that ancestor: the overlays stay confined to
    // the workspace (aligned to the map area, e.g. the layer control at the
    // map's bottom-left) instead of escaping to whatever container the host
    // application renders it in.
    <Box sx={{ position: 'relative' }}>
      <GeoVisProvider spec={spec}>
        <GeovisWorkspaceProviderWithRuntime
          config={config}
          selection={variables}
          onSelectionChange={onVariableChange}
          onRepair={onRepair}
          onLayerVisibilityChange={onLayerVisibilityChange}
          isLeftSidebarOpen={isLeftSidebarOpen}
          onLeftSidebarOpenChange={setIsLeftSidebarOpen}
        >
          <Layout />
        </GeovisWorkspaceProviderWithRuntime>
      </GeoVisProvider>
    </Box>
  );
};
