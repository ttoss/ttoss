import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { VisualizationSpec } from '@ttoss/geovis';
import {
  GeovisWorkspace,
  type GeovisWorkspaceConfig,
} from '@ttoss/geovis-workspace';
import { Box, Flex, Text } from '@ttoss/ui';
import * as React from 'react';

import { withPtBr } from './GeovisWorkspace.decorators';

const DEFAULT_SPEC: VisualizationSpec = {
  schemaVersion: 2,
  title: 'Pessoas atendidas - Cozinhas Solidárias',
  mapType: 'proportionalCircles',
  engine: 'maplibre',
  view: { center: [-51.9253, -14.235], zoom: 3.5 },
  sources: [
    {
      id: 'municipios',
      type: 'geojson',
      data: '/geo/geojs-100-mun.json',
    },
  ],
  mapData: [
    {
      mapDataId: 'pessoas_atendidas',
      mapId: 'municipios',
      title: 'Pessoas atendidas',
      joinKey: 'codarea',
      stateKey: 'value',
      dimension: 'size',
      data: [
        { geometryId: '3304557', value: 26971 },
        { geometryId: '2930501', value: 1247 },
        { geometryId: '2709400', value: 475 },
        { geometryId: '3513801', value: 80 },
        { geometryId: '2408102', value: 7301 },
        { geometryId: '3550308', value: 159454 },
        { geometryId: '2200400', value: 80715 },
      ],
    },
  ],
  layers: [
    {
      id: 'municipios-circulos',
      sourceId: 'municipios',
      geometry: 'point',
      title: 'Pessoas atendidas',
      mapDataId: 'pessoas_atendidas',
      sizeBy: {
        mode: 'continuous',
        range: [4, 40],
        transform: 'sqrt',
      },
      activeLegendId: 'tamanho-circulos',
      legends: [
        {
          id: 'tamanho-circulos',
          title: 'Pessoas atendidas',
          subtitle: 'Tamanho proporcional ao total de pessoas atendidas',
          labelFormat: { type: 'count', abbreviate: true },
          normalization: {
            type: 'raw',
            numeratorLabel: 'Pessoas atendidas',
          },
        },
      ],
    },
  ],
};

const workspaceConfig: GeovisWorkspaceConfig = {
  leftSidebar: {
    sections: [
      {
        id: 'variable',
        header: { title: 'Variável', icon: 'lucide:layers' },
        body: {
          kind: 'variations',
          menuId: 'variable',
          defaultValue: 'cumulative-rate',
          groups: [
            {
              id: 'metrics',
              label: 'Métricas',
              variations: [
                {
                  value: 'cumulative-rate',
                  label: 'Taxa cumulativa (% do total)',
                },
              ],
            },
          ],
        },
      },
    ],
  },
  rightSidebar: { title: 'Detalhes' },
};

const SpecInputStory = () => {
  const [specInput, setSpecInput] = React.useState(
    JSON.stringify(DEFAULT_SPEC, null, 2)
  );

  const [spec, setSpec] = React.useState<VisualizationSpec | null>(
    DEFAULT_SPEC
  );

  const [error, setError] = React.useState<string | null>(null);

  const handleSpecChange = (value: string) => {
    setSpecInput(value);
    try {
      const parsed = JSON.parse(value);
      setSpec(parsed);
      setError(null);
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : 'Invalid JSON');
      setSpec(null);
    }
  };

  return (
    <Flex
      sx={{
        flexDirection: 'column',
        gap: '3',
        height: '100vh',
        paddingX: '4',
        paddingY: '3',
      }}
    >
      <Box>
        <Text sx={{ fontSize: 'sm', fontWeight: 'bold', marginBottom: '2' }}>
          VisualizationSpec JSON Input
        </Text>
        <textarea
          value={specInput}
          onChange={(e) => {
            return handleSpecChange(e.currentTarget.value);
          }}
          style={{
            width: '100%',
            minHeight: '300px',
            padding: '8px',
            fontFamily: 'monospace',
            fontSize: '12px',
            border: error ? '2px solid #dc2626' : '1px solid #e5e7eb',
            borderRadius: '4px',
            backgroundColor: '#f9fafb',
          }}
        />
        {error && (
          <Text sx={{ fontSize: 'sm', color: '#dc2626', marginTop: '1' }}>
            Parse error: {error}
          </Text>
        )}
      </Box>

      {spec ? (
        <Box
          sx={{
            flex: 1,
            overflow: 'hidden',
            border: '1px solid #e5e7eb',
            borderRadius: '4px',
          }}
        >
          <GeovisWorkspace
            config={{
              leftSidebar: workspaceConfig.leftSidebar,
              rightSidebar: workspaceConfig.rightSidebar,
              slots: { metadata: { hidden: true } },
            }}
            visualizationSpec={spec}
          />
        </Box>
      ) : (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f3f4f6',
          }}
        >
          <Text sx={{ fontSize: 'sm', color: '#6b7280' }}>
            Invalid spec. Fix the JSON above to render.
          </Text>
        </Box>
      )}
    </Flex>
  );
};

const meta: Meta<typeof GeovisWorkspace> = {
  title: 'Geovis Workspace/GeovisWorkspace',
  component: GeovisWorkspace,
  tags: ['autodocs'],
  decorators: [withPtBr],
};

export default meta;
type Story = StoryObj<typeof GeovisWorkspace>;

/**
 * Renders the workspace with a JSON-editable spec. Paste any `VisualizationSpec`
 * into the textarea and see it render live on the map. Errors are caught and
 * displayed inline. Useful for testing spec variations and debugging spec
 * structure issues.
 */
export const SpecInput: Story = {
  render: () => {
    return <SpecInputStory />;
  },
  parameters: {
    layout: 'fullscreen',
  },
};
