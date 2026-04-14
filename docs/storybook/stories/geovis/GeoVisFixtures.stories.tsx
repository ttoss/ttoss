import type { Meta, StoryFn } from '@storybook/react-webpack5';
import type { VisualizationSpec } from '@ttoss/geovis';
import { GeoVisCanvas, GeoVisProvider } from '@ttoss/geovis';
import * as React from 'react';

type FixtureName = 'single-map';

type FixtureSpec = {
  id: string;
} & VisualizationSpec;

type FixtureReference = {
  label: string;
  url: string;
};

const fixtureReferences: Record<FixtureName, FixtureReference[]> = {
  'single-map': [
    {
      label: 'MapLibre official example (source)',
      url: 'https://github.com/maplibre/maplibre-gl-js/blob/main/test/examples/add-multiple-geometries-from-one-geojson-source.html#L24',
    },
    {
      label: 'Polygon and points section',
      url: 'https://github.com/maplibre/maplibre-gl-js/blob/main/test/examples/add-multiple-geometries-from-one-geojson-source.html#L35',
    },
  ],
};

const loadFixture = async (name: FixtureName): Promise<FixtureSpec> => {
  switch (name) {
    case 'single-map':
      return (
        await import('../../../../packages/geovis/src/fixtures/single-map.json')
      ).default as FixtureSpec;
  }
};

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

export const SingleMap: StoryFn = () => {
  const fixtureName: FixtureName = 'single-map';
  const [spec, setSpec] = React.useState<FixtureSpec | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setSpec(null);
    setLoadError(null);

    loadFixture(fixtureName)
      .then((nextSpec) => {
        if (!cancelled) setSpec(nextSpec);
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : String(error));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [fixtureName]);

  const references = fixtureReferences[fixtureName];

  if (loadError) {
    return <p>{loadError}</p>;
  }

  if (!spec) {
    return <p>Loading fixture...</p>;
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div>
        <strong>{spec.title ?? spec.id}</strong>
        {spec.description ? <p>{spec.description}</p> : null}
      </div>

      {spec.engine === 'maplibre' ? (
        <div
          style={{ width: '100%', height: 560, border: '1px solid #d4d4d8' }}
        >
          <GeoVisProvider spec={spec}>
            <GeoVisCanvas viewId="primary" />
          </GeoVisProvider>
        </div>
      ) : (
        <div style={{ border: '1px solid #d4d4d8', padding: 12 }}>
          <p>
            This fixture uses the {spec.engine} engine and is shown here as a
            data-reference demo because the runtime adapter is currently
            available for maplibre only.
          </p>
        </div>
      )}

      <div>
        <strong>Official references (with anchors)</strong>
        <ul>
          {references.map((reference) => {
            return (
              <li key={reference.url}>
                <a href={reference.url} target="_blank" rel="noreferrer">
                  {reference.label}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
