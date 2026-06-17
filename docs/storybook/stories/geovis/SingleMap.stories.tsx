import type { Meta, StoryFn } from '@storybook/react-webpack5';
import type { VisualizationSpec } from '@ttoss/geovis';

import singleMapSpec from '../../../../packages/geovis/src/fixtures/single-map.json';
import { GeoVisFixtureStory } from './GeoVisFixtureStory';
import { computeBbox } from './helpers/map-story-helpers';

export default {
  title: 'GeoVis/Fixtures/SingleMap',
  tags: ['autodocs'],
} as Meta;

const singleMapBbox = computeBbox(
  singleMapSpec.sources[0].data as GeoJSON.FeatureCollection
);

export const SingleMap: StoryFn = () => {
  return (
    <GeoVisFixtureStory
      spec={singleMapSpec as unknown as VisualizationSpec}
      bbox={singleMapBbox}
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
