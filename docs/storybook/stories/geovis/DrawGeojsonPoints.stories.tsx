import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { VisualizationSpec } from '@ttoss/geovis';
import { GeoVisCanvas, GeoVisProvider } from '@ttoss/geovis';

/**
 * Fictitious points: round, made-up coordinates and years, only to show the
 * dots.
 */
const GEOJSON_DATA: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [95, 15] },
      properties: { pointId: 'p1', year: '2005' },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [10, 45] },
      properties: { pointId: 'p2', year: '2006' },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-120, 50] },
      properties: { pointId: 'p3', year: '2007' },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [20, -30] },
      properties: { pointId: 'p4', year: '2008' },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [145, -30] },
      properties: { pointId: 'p5', year: '2009' },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [0, 40] },
      properties: { pointId: 'p6', year: '2010' },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-100, 40] },
      properties: { pointId: 'p7', year: '2011' },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-5, 55] },
      properties: { pointId: 'p8', year: '2012' },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-115, 45] },
      properties: { pointId: 'p9', year: '2013' },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [125, 35] },
      properties: { pointId: 'p10', year: '2014' },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [15, 50] },
      properties: { pointId: 'p11', year: '2015' },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-75, 40] },
      properties: { pointId: 'p12', year: '2016' },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [35, -5] },
      properties: { pointId: 'p13', year: '2017' },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [25, 45] },
      properties: { pointId: 'p14', year: '2018' },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-110, 55] },
      properties: { pointId: 'p15', year: '2019' },
    },
  ],
};

const DEFAULT_SPEC: VisualizationSpec = {
  title: 'Dot Density Map',
  description:
    'Fictitious points around the world, rendered as dot density with year on hover.',
  engine: 'maplibre',
  mapType: 'dotDensity',
  view: {
    center: [10, 50],
    zoom: 3,
  },
  basemap: {
    styleUrl: 'https://demotiles.maplibre.org/style.json',
  },
  sources: [
    {
      id: 'points',
      type: 'geojson',
      data: GEOJSON_DATA,
    },
  ],
  layers: [
    {
      id: 'points-dots',
      sourceId: 'points',
      geometry: 'point',
      paint: {
        circleRadius: 8,
      },
    },
  ],
  mapData: [
    {
      mapDataId: 'events',
      mapId: 'points',
      data: GEOJSON_DATA.features.map((f) => {
        return {
          geometryId: (f.properties?.pointId as string) ?? '',
          value: 1,
        };
      }),
    },
  ],
};

const DrawGeojsonPoints = ({ spec }: { spec: VisualizationSpec }) => {
  return (
    <div style={{ width: '100%', height: 560, border: '1px solid #d4d4d8' }}>
      <GeoVisProvider spec={spec}>
        <GeoVisCanvas viewId="primary" />
      </GeoVisProvider>
    </div>
  );
};

const meta = {
  title: 'GeoVis/DrawGeojsonPoints',
  component: DrawGeojsonPoints,
  tags: ['autodocs'],
  argTypes: {
    spec: {
      control: 'object',
      description:
        'VisualizationSpec com mapType: "dotDensity". Edite sources, mapData e layers pelo controle de objetos.',
    },
  },
} satisfies Meta<typeof DrawGeojsonPoints>;

export default meta;

type Story = StoryObj<typeof meta>;

export const DotDensityMinimal: Story = {
  args: { spec: DEFAULT_SPEC },
};
