import type { Meta, StoryFn } from '@storybook/react-webpack5';
import type { PartialVisualizationSpec } from '@ttoss/geovis';

import singleMapSpec from '../../../../packages/geovis/src/fixtures/single-map.minimal.json';
import {
  BASEMAP_ARG_TYPE,
  type BasemapArgs,
  DEFAULT_BASEMAP_ARGS,
} from './_map-story-helpers';
import { GeoVisFixtureStory } from './GeoVisFixtureStory';

export default {
  title: 'GeoVis/Fixtures/SingleMap',
  tags: ['autodocs'],
  argTypes: BASEMAP_ARG_TYPE,
  args: DEFAULT_BASEMAP_ARGS,
} as Meta<BasemapArgs>;

/**
 * Minimal single-map example. The fixture JSON contains only a `data` entry;
 * `id`, `engine`, `view`, and `layers` are derived by `applyDefaults` inside
 * the runtime.
 */
export const SingleMap: StoryFn<BasemapArgs> = ({ basemapStyleUrl }) => {
  return (
    <GeoVisFixtureStory
      spec={singleMapSpec as PartialVisualizationSpec}
      basemapStyleUrl={basemapStyleUrl}
      title="Single Map"
      description="Polygon and point markers from a single geojson-inline source."
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
