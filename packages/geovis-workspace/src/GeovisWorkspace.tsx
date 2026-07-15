import type { VisualizationSpec } from '@ttoss/geovis';
import { GeoVisCanvas, GeoVisProvider, useGeoVisClick } from '@ttoss/geovis';
import { Box } from '@ttoss/ui';
import * as React from 'react';

import { Layout } from './components/Layout';
import {
  type GeovisWorkspaceConfig,
  type GeovisWorkspaceSelection,
} from './context/GeovisWorkspaceContext';
import { GeovisWorkspaceProvider } from './GeovisWorkspaceProvider';
import { useGeovisWorkspace } from './hooks/useGeovisWorkspace';

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
/**
 * Bridges GeoVis map clicks to the workspace: reads the persistent click
 * selection and forwards it to `selectFeature`, which runs the configured
 * `onFeatureSelect` and opens the right sidebar. Renders nothing. Lives inside
 * `<GeoVisProvider>` so it can read `useGeoVisClick()`.
 */
const FeatureClickBridge = () => {
  const clicked = useGeoVisClick();

  const { selectFeature } = useGeovisWorkspace();

  const selectFeatureRef = React.useRef(selectFeature);
  React.useEffect(() => {
    selectFeatureRef.current = selectFeature;
  }, [selectFeature]);

  // Fire only when the clicked feature itself changes — not when `selectFeature`
  // is recreated — so recreating `config` never retriggers the fetch.
  const featureKey = clicked
    ? `${clicked.layerId}:${String(clicked.featureId)}`
    : null;

  React.useEffect(() => {
    selectFeatureRef.current(clicked);
    // `clicked` is intentionally omitted: `featureKey` derives from it and is
    // the value we want to react to.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featureKey]);

  return null;
};

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
        <FeatureClickBridge />
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
