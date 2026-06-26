import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { VisualizationSpec } from '@ttoss/geovis';
import { GeoVisCanvas, GeoVisProvider } from '@ttoss/geovis';

import singleMapSpec from '../../../../packages/geovis/src/fixtures/single-map.json';
import { computeBbox, FitBoundsToBbox } from './helpers/map-story-helpers';

const baseSpec = singleMapSpec as unknown as VisualizationSpec;

const bbox = computeBbox(baseSpec.sources[0].data as GeoJSON.FeatureCollection);

/**
 * Demonstrates `basemap.labels`. Toggle the `labels` control to hide or show
 * the basemap's text/icon (`symbol`) layers at runtime. Switching it back to
 * `true` restores the basemap labels without a page reload, proving the spec
 * drives the behaviour reactively.
 */
const BasemapLabelsDemo = ({ labels }: { labels: boolean }) => {
  const spec: VisualizationSpec = {
    ...baseSpec,
    basemap: { ...baseSpec.basemap, labels },
  };

  return (
    <div style={{ width: '100%', height: 560, border: '1px solid #d4d4d8' }}>
      <GeoVisProvider spec={spec}>
        <GeoVisCanvas viewId="primary" />
        {bbox != null ? <FitBoundsToBbox bbox={bbox} /> : null}
      </GeoVisProvider>
    </div>
  );
};

const meta = {
  title: 'GeoVis/Basemap/Labels',
  component: BasemapLabelsDemo,
  tags: ['autodocs'],
  argTypes: {
    labels: {
      control: 'boolean',
      description:
        'When `false`, hides every basemap `symbol` layer (place names, road names, POI icons).',
    },
  },
} satisfies Meta<typeof BasemapLabelsDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Basemap with labels visible (default). */
export const LabelsVisible: Story = {
  args: { labels: true },
};

/** Basemap with labels hidden via `basemap: { labels: false }`. */
export const LabelsHidden: Story = {
  args: { labels: false },
};
