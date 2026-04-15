import type { Meta, StoryFn } from '@storybook/react-webpack5';
import type { VisualizationSpec } from '@ttoss/geovis';

import geojsonUrlMapSpec from '../../../../packages/geovis/src/fixtures/source-geojson-url-map.json';
import { GeoVisFixtureStory } from './GeoVisFixtureStory';

export default {
  title: 'GeoVis/Fixtures/GeoJsonUrlMap',
  tags: ['autodocs'],
} as Meta;

export const GeoJsonUrlMap: StoryFn = () => {
  return (
    <GeoVisFixtureStory
      spec={geojsonUrlMapSpec as unknown as VisualizationSpec}
    />
  );
};
