import type { Meta, StoryFn } from '@storybook/react-webpack5';
import type { PartialVisualizationSpec } from '@ttoss/geovis';

import geojsonUrlMapSpec from '../../../../packages/geovis/src/fixtures/geojson-url-map.minimal.json';
import {
  BASEMAP_ARG_TYPE,
  type BasemapArgs,
  DEFAULT_BASEMAP_ARGS,
} from './_map-story-helpers';
import { GeoVisFixtureStory } from './GeoVisFixtureStory';

export default {
  title: 'GeoVis/Fixtures/GeoJsonUrlMap',
  tags: ['autodocs'],
  argTypes: BASEMAP_ARG_TYPE,
  args: DEFAULT_BASEMAP_ARGS,
} as Meta<BasemapArgs>;

/**
 * Loads GeoJSON from a public URL.
 *
 * The fixture contains only `data` with a `geojson-url` entry; the runtime
 * derives `id`, `engine`, `view`, and `layers` via `applyDefaults`. Because
 * the bounding box of a remote URL cannot be known statically, the spec
 * defaults to a world view and the MapLibre adapter calls `fitBounds`
 * once the source loads (`view.autoFit`).
 */
export const GeoJsonUrlMap: StoryFn<BasemapArgs> = ({ basemapStyleUrl }) => {
  return (
    <GeoVisFixtureStory
      spec={geojsonUrlMapSpec as PartialVisualizationSpec}
      basemapStyleUrl={basemapStyleUrl}
      title="GeoJSON URL Map"
      description="Remote GeoJSON loaded by the engine from an HTTPS URL."
    />
  );
};
