import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { GeovisWorkspace } from '@ttoss/geovis-workspace';

const meta: Meta<typeof GeovisWorkspace> = {
  title: 'Geovis Workspace/GeovisWorkspace',
  component: GeovisWorkspace,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '`GeovisWorkspace` with an empty `config`: only `visualizationSpec` drives the map, so no sidebars render.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof GeovisWorkspace>;

/**
 * Renders `GeovisWorkspace` with an empty `config` and only
 * `visualizationSpec` — no selection state, no sidebars.
 */
export const SpecOnly: Story = {
  render: () => {
    return (
      <GeovisWorkspace
        config={{}}
        visualizationSpec={{
          title: 'Invalid Raw Count Choropleth',
          description:
            'Intentionally invalid by cartography policy: choropleth encoded with raw population counts instead of a normalized density. Kigali City has the smallest population (1.1M) but the highest density (1551 hab/km²) — it looks least intense on the left map but most intense on the right.',
          engine: 'maplibre',
          basemap: {
            styleUrl: 'https://tiles.openfreemap.org/styles/bright',
          },
          sources: [
            {
              id: 'rwanda-provinces',
              type: 'geojson',
              data: 'https://maplibre.org/maplibre-gl-js/docs/assets/rwanda-provinces.geojson',
            },
          ],
          layers: [
            {
              id: 'rwanda-choropleth',
              sourceId: 'rwanda-provinces',
              geometry: 'polygon',
              visible: true,
              paint: {
                lineColor: '#94a3b8',
                lineWidth: 0.5,
              },
            },
          ],
          metadata: {
            isPolicyInvalid: true,
            invalidReason: 'raw-count-choropleth',
            metricField: 'population',
            normalizedExpression: 'population / sq-km',
            normalizedLabel: 'inhabitants per km²',
            referenceExample:
              'https://maplibre.org/maplibre-gl-js/docs/examples/visualize-population-density/',
          },
        }}
      />
    );
  },
};
