import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { VisualizationSpec } from '@ttoss/geovis';
import { GeoVisCanvas, GeoVisProvider } from '@ttoss/geovis';
import * as React from 'react';

/**
 * Two point snapshots at different Brazilian locations. Switching between them
 * changes the source `data` reference, which — because the layer declares a
 * `crossfade` transition — fades the old points out while the new fade in.
 */
const SNAPSHOTS: Record<string, GeoJSON.FeatureCollection> = {
  '2024': {
    type: 'FeatureCollection',
    features: [
      [-46.63, -23.55],
      [-43.17, -22.91],
      [-38.51, -12.97],
      [-60.02, -3.1],
      [-49.27, -25.43],
    ].map((coordinates, index) => {
      return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates },
        properties: { pointId: `a${index}` },
      };
    }),
  },
  '2025': {
    type: 'FeatureCollection',
    features: [
      [-34.88, -8.05],
      [-51.23, -30.03],
      [-47.88, -15.79],
      [-38.52, -3.73],
      [-56.1, -15.6],
    ].map((coordinates, index) => {
      return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates },
        properties: { pointId: `b${index}` },
      };
    }),
  },
};

/** Builds a spec whose single point layer crossfades on data changes. */
const buildSpec = (data: GeoJSON.FeatureCollection): VisualizationSpec => {
  return {
    title: 'Crossfade transition',
    engine: 'maplibre',
    view: { center: [-52, -15], zoom: 3.2 },
    basemap: { styleUrl: 'https://demotiles.maplibre.org/style.json' },
    sources: [{ id: 'points', type: 'geojson', data }],
    layers: [
      {
        id: 'points-dots',
        sourceId: 'points',
        geometry: 'point',
        // Opt into the crossfade: on a data change the old points fade out
        // while the new points fade in over `durationMs`.
        transition: { kind: 'crossfade', durationMs: 600, easing: 'ease-out' },
        paint: {
          circleRadius: 10,
          circleColor: '#337C59',
          circleOpacity: 0.9,
          circleStrokeColor: '#ffffff',
          circleStrokeWidth: 1.5,
        },
      },
    ],
  };
};

/** Interactive demo: a toggle swaps the snapshot and the map crossfades. */
const CrossfadeDemo = () => {
  const [snapshot, setSnapshot] = React.useState<'2024' | '2025'>('2024');
  const spec = React.useMemo(() => {
    return buildSpec(SNAPSHOTS[snapshot]);
  }, [snapshot]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {(['2024', '2025'] as const).map((year) => {
          const active = year === snapshot;
          return (
            <button
              key={year}
              type="button"
              onClick={() => {
                setSnapshot(year);
              }}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                cursor: 'pointer',
                border: `1px solid ${active ? '#337C59' : '#d4d4d8'}`,
                background: active ? '#337C59' : '#ffffff',
                color: active ? '#ffffff' : '#3f3f46',
              }}
            >
              {year}
            </button>
          );
        })}
        <span style={{ fontSize: 13, color: '#71717a' }}>
          Alterne os anos para ver o crossfade dos pontos.
        </span>
      </div>

      <div style={{ width: '100%', height: 560, border: '1px solid #d4d4d8' }}>
        <GeoVisProvider spec={spec}>
          <GeoVisCanvas viewId="primary" />
        </GeoVisProvider>
      </div>
    </div>
  );
};

const meta = {
  title: 'GeoVis/Fixtures/Crossfade',
  component: CrossfadeDemo,
  tags: ['autodocs'],
} satisfies Meta<typeof CrossfadeDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Toggle between the two snapshots to trigger the crossfade transition. */
export const PointsCrossfade: Story = {};
