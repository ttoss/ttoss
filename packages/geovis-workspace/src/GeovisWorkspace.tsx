import type { VisualizationSpec } from '@ttoss/geovis';
import { GeoVisCanvas, GeoVisProvider } from '@ttoss/geovis';
import { Box } from '@ttoss/ui';

import { Layout } from './components/Layout';
import {
  type GeovisWorkspaceConfig,
  type GeovisWorkspaceSelection,
} from './context/GeovisWorkspaceContext';
import { GeovisWorkspaceProvider } from './GeovisWorkspaceProvider';

export interface GeovisWorkspaceProps {
  config: GeovisWorkspaceConfig;
  visualizationSpec: VisualizationSpec;
  variables?: GeovisWorkspaceSelection;
  onVariableChange?: (variables: GeovisWorkspaceSelection) => void;
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
}: GeovisWorkspaceProps) => {
  return (
    <GeoVisProvider spec={visualizationSpec}>
      {/* `GeoVisProvider` auto-mounts any spec legend that declares a
          `position` as an absolutely-positioned overlay, anchored to the
          nearest positioned ancestor. This Box is that ancestor, so those
          overlays stay confined to the workspace instead of escaping into
          whatever container the host application renders it in. */}
      <Box sx={{ position: 'relative' }}>
        <GeovisWorkspaceProvider
          config={config}
          selection={variables}
          onSelectionChange={onVariableChange}
        >
          <Layout>
            <GeoVisCanvas style={{ width: '100%', height: '100%' }} />
          </Layout>
        </GeovisWorkspaceProvider>
      </Box>
    </GeoVisProvider>
  );
};
