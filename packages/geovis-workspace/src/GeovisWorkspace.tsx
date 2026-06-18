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
 * Renders the GeoVis map for the workspace inside the main content area. Kept
 * as an internal component so the map fills the layout's main slot and mounts
 * inside the provider tree.
 */
const GeovisWorkspaceMap = ({
  visualizationSpec,
}: {
  visualizationSpec: VisualizationSpec;
}) => {
  return (
    <Box
      sx={{
        position: 'relative',
        flex: 1,
        display: 'flex',
        minHeight: '440px',
      }}
    >
      <GeoVisProvider spec={visualizationSpec}>
        <GeoVisCanvas style={{ width: '100%', height: '100%' }} />
      </GeoVisProvider>
    </Box>
  );
};

export const GeovisWorkspace = ({
  config,
  visualizationSpec,
  variables,
  onVariableChange,
}: GeovisWorkspaceProps) => {
  return (
    <GeovisWorkspaceProvider
      config={config}
      selection={variables}
      onSelectionChange={onVariableChange}
    >
      <Layout>
        <GeovisWorkspaceMap visualizationSpec={visualizationSpec} />
      </Layout>
    </GeovisWorkspaceProvider>
  );
};
