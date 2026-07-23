import type { RepairOption, VisualizationSpec } from '@ttoss/geovis';
import { GeoVisProvider } from '@ttoss/geovis';
import { Box } from '@ttoss/ui';

import { Layout } from './components/Layout';
import {
  type GeovisWorkspaceConfig,
  type GeovisWorkspaceSelection,
} from './context/GeovisWorkspaceContext';
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
  return (
    <GeoVisProvider spec={visualizationSpec}>
      {/* `GeoVisProvider` auto-mounts any spec legend that declares a
          `position` as an absolutely-positioned overlay, anchored to the
          nearest positioned ancestor. This Box is that ancestor, so those
          overlays stay confined to the workspace instead of escaping into
          whatever container the host application renders it in. */}
      <Box sx={{ position: 'relative' }}>
        <GeovisWorkspaceProviderWithRuntime
          config={config}
          selection={variables}
          onSelectionChange={onVariableChange}
          onRepair={onRepair}
          onLayerVisibilityChange={onLayerVisibilityChange}
        >
          <Layout />
        </GeovisWorkspaceProviderWithRuntime>
      </Box>
    </GeoVisProvider>
  );
};
