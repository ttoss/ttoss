import type { Meta, StoryFn } from '@storybook/react-webpack5';
import type { VisualizationSpec } from '@ttoss/geovis';

import singleMapSpec from '../../../../packages/geovis/src/fixtures/single-map.json';
import { GeoVisFixtureStory } from './GeoVisFixtureStory';

export default {
  title: 'GeoVis/Fixtures/SingleMap',
  tags: ['autodocs'],
} as Meta;

export const SingleMap: StoryFn = () => {
  return (
    <GeoVisFixtureStory
      spec={singleMapSpec as unknown as VisualizationSpec}
      references={[
        {
          label: 'MapLibre official example (source)',
          url: 'https://github.com/maplibre/maplibre-gl-js/blob/main/test/examples/add-multiple-geometries-from-one-geojson-source.html#L24',
        },
        {
          label: 'Polygon and points section',
          url: 'https://github.com/maplibre/maplibre-gl-js/blob/main/test/examples/add-multiple-geometries-from-one-geojson-source.html#L35',
        },
      ]}
    />
  );
};
