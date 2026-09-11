import type { RepairOption, VisualizationSpec } from '@ttoss/geovis';
import { GeoVisProvider, useCompactViewport } from '@ttoss/geovis';
import { Box } from '@ttoss/ui';
import * as React from 'react';

import { Layout } from './components/Layout';
import {
  type GeovisWorkspaceConfig,
  type GeovisWorkspaceSelection,
} from './context/GeovisWorkspaceContext';
import {
  applyLeftSidebarControlOffset,
  applyRightSidebarLegendOffset,
  applyTimelineHudControlOffset,
} from './controlOffset';
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
  /**
   * Called with the full next selection whenever a variation is chosen or the
   * timeline advances.
   *
   * Return a promise when a variation costs a request: every menu goes inert
   * until it settles (resolve or reject), so the user cannot stack picks while
   * one is being served. Returning nothing keeps the menus live, which is what
   * a synchronous consumer wants and what timeline ticks always get.
   */
  onVariableChange?: (
    variables: GeovisWorkspaceSelection
  ) => void | Promise<unknown>;
  /**
   * Called with the chosen `RepairOption` when a repair button is pressed in
   * the `warnings` slot's default panel. Omit to render repair buttons
   * disabled rather than absent.
   */
  onRepair?: (repair: RepairOption) => void;
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
}: GeovisWorkspaceProps) => {
  // Owned here (rather than only inside the provider) so the spec fed to
  // `GeoVisProvider` can react to them: while a sidebar is open the map overlay
  // sharing its corner is shifted clear of it, since an opening sidebar
  // (z-index 2) otherwise covers the overlay (z-index 1). The left sidebar
  // shifts the layer control; the right sidebar shifts a right-anchored legend.
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = React.useState(() => {
    return config.leftSidebar?.initialState === 'open';
  });

  const [isRightSidebarOpen, setIsRightSidebarOpen] = React.useState(() => {
    return config.rightSidebar?.initialState === 'open';
  });

  // The compact timeline HUD is decided here for the same reason: it spans the
  // map's bottom edge, so while it shows the layer control has to sit above it.
  // `useTimeline` cannot own this — it needs the shared selection, which lives
  // in the provider below — so it reports the first play up through
  // `notifyPlaybackStart` and the flag is kept here.
  const isCompact = useCompactViewport();
  const [playbackStarted, setPlaybackStarted] = React.useState(false);
  const [hudDismissed, setHudDismissed] = React.useState(false);

  const isTimelineHudVisible =
    isCompact && playbackStarted && !hudDismissed && !isLeftSidebarOpen;

  const spec = React.useMemo(() => {
    const withControlOffset = applyLeftSidebarControlOffset({
      spec: visualizationSpec,
      leftSidebarOpen: isLeftSidebarOpen,
    });
    const withHudOffset = applyTimelineHudControlOffset({
      spec: withControlOffset,
      hudVisible: isTimelineHudVisible,
    });
    return applyRightSidebarLegendOffset({
      spec: withHudOffset,
      rightSidebarOpen: isRightSidebarOpen,
    });
  }, [
    visualizationSpec,
    isLeftSidebarOpen,
    isRightSidebarOpen,
    isTimelineHudVisible,
  ]);

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
          isLeftSidebarOpen={isLeftSidebarOpen}
          onLeftSidebarOpenChange={setIsLeftSidebarOpen}
          isRightSidebarOpen={isRightSidebarOpen}
          onRightSidebarOpenChange={setIsRightSidebarOpen}
          isTimelineHudVisible={isTimelineHudVisible}
          onPlaybackStart={() => {
            setPlaybackStarted(true);
            // A later play brings the bar back after a dismissal — otherwise
            // dismissing once would disarm it for the rest of the session.
            setHudDismissed(false);
          }}
          onTimelineHudDismiss={() => {
            setHudDismissed(true);
          }}
        >
          <Layout />
        </GeovisWorkspaceProviderWithRuntime>
      </GeoVisProvider>
    </Box>
  );
};
