import type { Meta, StoryFn } from '@storybook/react-webpack5';
import type { VisualizationSpec } from '@ttoss/geovis';
import { GeoVisCanvas, GeoVisProvider } from '@ttoss/geovis';

import singleMapSpec from '../../../../packages/geovis/src/fixtures/single-map.json';
import geojsonUrlMapSpec from '../../../../packages/geovis/src/fixtures/source-geojson-url-map.json';

export default {
  title: 'GeoVis/Fixtures',
  parameters: {
    docs: {
      description: {
        component:
          'GeoVis fixtures based on official sources. Each story includes direct references with anchors to the section where the example appears.',
      },
    },
  },
  tags: ['autodocs'],
} as Meta;

const FixtureStory = ({
  spec,
  references,
}: {
  spec: VisualizationSpec;
  references?: { label: string; url: string }[];
}) => {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div>
        <strong>{spec.title}</strong>
        {spec.description ? <p>{spec.description}</p> : null}
      </div>
      <div style={{ width: '100%', height: 560, border: '1px solid #d4d4d8' }}>
        <GeoVisProvider spec={spec}>
          <GeoVisCanvas viewId="primary" />
        </GeoVisProvider>
      </div>
      {references && references.length > 0 ? (
        <div>
          <strong>Official references (with anchors)</strong>
          <ul>
            {references.map((ref) => {
              return (
                <li key={ref.url}>
                  <a href={ref.url} target="_blank" rel="noreferrer">
                    {ref.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
};

export const SingleMap: StoryFn = () => {
  return (
    <FixtureStory
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

export const GeoJsonUrlMap: StoryFn = () => {
  return (
    <FixtureStory spec={geojsonUrlMapSpec as unknown as VisualizationSpec} />
  );
};
