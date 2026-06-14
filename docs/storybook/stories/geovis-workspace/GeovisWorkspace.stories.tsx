import type { Meta, StoryObj } from '@storybook/react-webpack5';
import {
  GeoVisCanvas,
  GeoVisProvider,
  type VisualizationSpec,
} from '@ttoss/geovis';
import { GeovisWorkspace } from '@ttoss/geovis-workspace';
import { Box } from '@ttoss/ui';

import singleMapSpec from '../../../../packages/geovis/src/fixtures/single-map.json';

const workspaceSpec = {
  leftSidebar: {
    menus: [
      {
        id: 'population',
        title: 'Variáveis',
        defaultValue: '5year-65plus',
        items: [
          { value: '5year-65plus', label: 'taxa cumulativa (% do total)' },
          {
            value: '5year-65plu',
            label: 'proporção cumulativa (% da pop 65+)',
          },
          { value: '0-14', label: 'faixa (% da pop 65+)' },
        ],
      },
      {
        id: 'age',
        title: 'Faixa etária',
        items: [
          { value: 'gdp', label: '65 anos ou mais' },
          { value: 'income', label: '70 anos ou mais' },
          { value: 'incom', label: '75 anos ou mais' },
        ],
      },
    ],
  },
  rightSidebar: { title: 'Detalhes' },
};

const spec = singleMapSpec as unknown as VisualizationSpec;

/**
 * Renders a real GeoVis map (from `@ttoss/geovis`) inside the workspace's
 * main content area, so the composition can be previewed end-to-end.
 */
const WorkspaceMap = () => {
  return (
    <Box sx={{ flex: 1, display: 'flex', minHeight: '440px' }}>
      <GeoVisProvider spec={spec}>
        <GeoVisCanvas
          viewId="primary"
          style={{ width: '100%', height: '100%' }}
        />
      </GeoVisProvider>
    </Box>
  );
};

const meta: Meta<typeof GeovisWorkspace> = {
  title: 'Geovis Workspace/GeovisWorkspace',
  component: GeovisWorkspace,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Composes a left sidebar (menu groups), a main content area (children), and an optional right sidebar — all driven by a single `spec`. State is managed internally via GeovisWorkspaceProvider.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof GeovisWorkspace>;

/**
 * Default story: a GeoVis map is rendered as children in the main content area.
 */
export const Default: Story = {
  args: {
    spec: workspaceSpec,
  },
  render: (args) => {
    return (
      <GeovisWorkspace {...args}>
        <WorkspaceMap />
      </GeovisWorkspace>
    );
  },
};

/**
 * Only the left sidebar is defined — the right sidebar and its button are absent.
 */
export const LeftSidebarOnly: Story = {
  args: {
    spec: { leftSidebar: workspaceSpec.leftSidebar },
  },
  render: (args) => {
    return (
      <GeovisWorkspace {...args}>
        <WorkspaceMap />
      </GeovisWorkspace>
    );
  },
};
