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
  /** Config describing the left and right sidebars. */
  config: GeovisWorkspaceConfig;
  /** GeoVis spec rendered in the main map area. */
  visualizationSpec: VisualizationSpec;
  /**
   * Active item value per menu group, keyed by menu id. Provide it to control
   * the selection from the parent and rebuild `visualizationSpec` in response.
   * Omit it to let the workspace manage the selection internally (seeded from
   * each menu's `defaultValue`).
   */
  selection?: GeovisWorkspaceSelection;
  /**
   * Called with the full next selection whenever a menu item is selected. Use
   * it to derive the next `visualizationSpec`.
   */
  onSelectionChange?: (selection: GeovisWorkspaceSelection) => void;
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

/**
 * High-level component that composes a left sidebar (menu groups), a GeoVis map
 * in the main area, and an optional right sidebar — the sidebars driven by
 * `config` and the map driven by `visualizationSpec`. Sidebars only render when
 * defined in the config.
 *
 * The selection that drives the menus is reported through `onSelectionChange`;
 * the parent derives the next `visualizationSpec` from it so picking a menu item
 * recolors the map:
 *
 * ```tsx
 * const [selection, setSelection] = React.useState(
 *   getInitialSelection({ config })
 * );
 *
 * const visualizationSpec = React.useMemo(
 *   () => buildSpec(selection),
 *   [selection]
 * );
 *
 * <GeovisWorkspace
 *   config={config}
 *   visualizationSpec={visualizationSpec}
 *   selection={selection}
 *   onSelectionChange={setSelection}
 * />
 * ```
 */
export const GeovisWorkspace = ({
  config,
  visualizationSpec,
  selection,
  onSelectionChange,
}: GeovisWorkspaceProps) => {
  return (
    <GeovisWorkspaceProvider
      config={config}
      selection={selection}
      onSelectionChange={onSelectionChange}
    >
      <Layout>
        <GeovisWorkspaceMap visualizationSpec={visualizationSpec} />
      </Layout>
    </GeovisWorkspaceProvider>
  );
};
