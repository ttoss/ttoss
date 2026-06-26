import type { Meta, StoryFn } from '@storybook/react-webpack5';
import type { SetViewOptions, VisualizationSpec } from '@ttoss/geovis';
import { GeoVisCanvas, GeoVisProvider, useGeoVis } from '@ttoss/geovis';

import geojsonUrlMapSpec from '../../../../packages/geovis/src/fixtures/geojson-url-map.json';
import { FitBoundsToUrlSource } from './helpers/map-story-helpers';

export default {
  title: 'GeoVis/Fixtures/GeoJsonUrlMap',
  tags: ['autodocs'],
} as Meta;

const SOURCE_URL = geojsonUrlMapSpec.sources[0].data as string;

/** Preset camera positions used by the SetView demo buttons. */
const PRESETS: { label: string; options: SetViewOptions }[] = [
  {
    label: 'São Paulo',
    options: { center: [-46.6333, -23.5505], zoom: 10, animate: true },
  },
  {
    label: 'Zoom out',
    options: { zoom: 3, animate: true },
  },
];

/**
 * Renders `setView` demo buttons inside the GeoVisProvider context.
 * Each button calls `setView` with a different subset of camera options,
 * showing that partial updates (e.g. zoom-only or pitch-only) work correctly.
 */
const SetViewControls = () => {
  const { setView } = useGeoVis();

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {PRESETS.map(({ label, options }) => {
        return (
          <button
            key={label}
            type="button"
            onClick={() => {
              return setView(options);
            }}
            style={{
              padding: '4px 10px',
              fontSize: 12,
              cursor: 'pointer',
              borderRadius: 4,
              border: '1px solid #a1a1aa',
              background: '#fafafa',
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};

export const GeoJsonUrlMap: StoryFn = () => {
  return (
    <GeoVisProvider spec={geojsonUrlMapSpec as unknown as VisualizationSpec}>
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <strong>{geojsonUrlMapSpec.title}</strong>
          <p>{geojsonUrlMapSpec.description}</p>
        </div>
        <div
          style={{ width: '100%', height: 560, border: '1px solid #d4d4d8' }}
        >
          <GeoVisCanvas viewId="primary" />
          <FitBoundsToUrlSource url={SOURCE_URL} />
        </div>
        <SetViewControls />
      </div>
    </GeoVisProvider>
  );
};
