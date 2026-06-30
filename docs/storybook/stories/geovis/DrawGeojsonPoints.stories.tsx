import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { VisualizationSpec } from '@ttoss/geovis';
import { GeoVisCanvas, GeoVisProvider } from '@ttoss/geovis';

const GEOJSON_DATA: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.4933, 13.7551] },
      properties: { pointId: 'p1', year: '2004' },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [6.6523, 46.5535] },
      properties: { pointId: 'p2', year: '2006' },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-123.3596, 48.4268] },
      properties: { pointId: 'p3', year: '2007' },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [18.4264, -33.9224] },
      properties: { pointId: 'p4', year: '2008' },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [151.195, -33.8552] },
      properties: { pointId: 'p5', year: '2009' },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [2.1404, 41.3925] },
      properties: { pointId: 'p6', year: '2010' },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-104.8548, 39.7644] },
      properties: { pointId: 'p7', year: '2011' },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-1.1665, 52.9539] },
      properties: { pointId: 'p8', year: '2013' },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-122.6544, 45.5428] },
      properties: { pointId: 'p9', year: '2014' },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [126.974, 37.5651] },
      properties: { pointId: 'p10', year: '2015' },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [7.1112, 50.7255] },
      properties: { pointId: 'p11', year: '2016' },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-71.0314, 42.3539] },
      properties: { pointId: 'p12', year: '2017' },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [39.2794, -6.8173] },
      properties: { pointId: 'p13', year: '2018' },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [26.0961, 44.4379] },
      properties: { pointId: 'p14', year: '2019' },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-114.0879, 51.0279] },
      properties: { pointId: 'p15', year: '2020' },
    },
  ],
};

const DEFAULT_SPEC: VisualizationSpec = {
  id: 'dot-density-minimal',
  title: 'Dot Density Map',
  description: 'Global points rendered as dot density with year on hover.',
  engine: 'maplibre',
  mapType: 'dotDensity',
  view: {
    center: [10, 50],
    zoom: 3,
  },
  basemap: {
    style: 'https://demotiles.maplibre.org/style.json',
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
  title: 'GeoVis/Fixtures/DrawGeojsonPoints',
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
