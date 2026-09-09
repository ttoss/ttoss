import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { VisualizationSpec } from '@ttoss/geovis';
import {
  GeovisWorkspace,
  type GeovisWorkspaceConfig,
  type GeovisWorkspaceSelection,
} from '@ttoss/geovis-workspace';
import * as React from 'react';

import { withPtBr } from './GeovisWorkspace.decorators';

/**
 * Connects the preview sidebar's **timeline** to the geovis **crossfade**: the
 * timeline writes the current year to `selection.year`; the story rebuilds the
 * spec with that year's points; and because the point layer declares a
 * `crossfade` transition, changing the source `data` fades the previous year's
 * dots out while the new year's fade in.
 *
 * Points are a single static color here (no feature-state), and each year some
 * appear while others disappear (churn) — so advancing/playing the timeline
 * exercises both the crossfade fade-in (new dots) and fade-out (removed dots).
 */

const YEARS = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];
const FIRST_YEAR = YEARS[0];
const LAST_YEAR = YEARS[YEARS.length - 1];

/** Deterministic pseudo-random in [0, 1) — keeps the demo stable across renders. */
const pseudo = (n: number): number => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Rough Brazil bounding box the demo scatters points across. */
const BBOX = { minLng: -72, maxLng: -35, minLat: -32, maxLat: 4 };

const MAX_POINTS = 1600;

/**
 * Every point, generated once at a stable position and given an active window
 * `[birth, death)`. Each year renders only the points alive that year, so over
 * time some points appear (born) and others disappear (die) — real churn rather
 * than a strictly growing set — exercising the crossfade's fade-in AND fade-out.
 */
const ALL_POINTS = Array.from({ length: MAX_POINTS }, (_, index) => {
  // Born from a few years before the window to its end, alive for 2–6 years.
  const birth = FIRST_YEAR - 4 + Math.floor(pseudo(index * 3 + 5) * 14);
  const life = 2 + Math.floor(pseudo(index * 3 + 6) * 5);
  return {
    id: `p${index}`,
    lng: BBOX.minLng + pseudo(index * 2 + 1) * (BBOX.maxLng - BBOX.minLng),
    lat: BBOX.minLat + pseudo(index * 2 + 2) * (BBOX.maxLat - BBOX.minLat),
    birth,
    death: birth + life,
  };
});

/** The points alive in the given year (`birth <= year < death`). */
const pointsForYear = (year: number) => {
  return ALL_POINTS.filter((point) => {
    return point.birth <= year && year < point.death;
  });
};

/** The year's points as a GeoJSON FeatureCollection (a new reference per year). */
const buildYearPoints = (year: number): GeoJSON.FeatureCollection => {
  return {
    type: 'FeatureCollection',
    features: pointsForYear(year).map((point) => {
      return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [point.lng, point.lat] },
        properties: { id: point.id },
      };
    }),
  };
};

/** Spec for one year: a single point layer that crossfades on data changes. */
const buildSpec = (year: number): VisualizationSpec => {
  return {
    title: 'Timeline crossfade',
    engine: 'maplibre',
    view: { center: [-52, -15], zoom: 3.2 },
    basemap: { styleUrl: 'https://demotiles.maplibre.org/style.json' },
    sources: [{ id: 'points', type: 'geojson', data: buildYearPoints(year) }],
    layers: [
      {
        id: 'points-dots',
        sourceId: 'points',
        geometry: 'point',
        transition: { kind: 'crossfade', durationMs: 600, easing: 'ease-out' },
        paint: {
          circleRadius: 5,
          circleColor: '#337C59',
          circleOpacity: 0.9,
          circleStrokeColor: '#ffffff',
          circleStrokeWidth: 1,
        },
      },
    ],
  };
};

/** Config: an open sidebar whose single tab hosts the timeline. */
const config: GeovisWorkspaceConfig = {
  leftSidebar: {
    initialState: 'open',
    sections: [
      {
        id: 'filters',
        header: { title: 'Linha do Tempo', icon: 'lucide:clock' },
        body: {
          kind: 'filters',
          blocks: [
            {
              id: 'timeline',
              title: 'Linha do Tempo',
              icon: 'lucide:clock',
              control: {
                kind: 'timeline',
                // Publishes the current year to `selection.year`, which the demo
                // reads to rebuild the spec and drive the crossfade.
                menuId: 'year',
                min: FIRST_YEAR,
                max: LAST_YEAR,
                defaultValue: LAST_YEAR,
                unitLabel: 'pontos',
                histogram: YEARS.map((year) => {
                  return { key: year, count: pointsForYear(year).length };
                }),
              },
            },
          ],
        },
      },
    ],
  },
};

const TimelineCrossfadeDemo = () => {
  const [selection, setSelection] = React.useState<GeovisWorkspaceSelection>({
    year: String(LAST_YEAR),
  });

  const year = Number(selection.year) || LAST_YEAR;
  const spec = React.useMemo(() => {
    return buildSpec(year);
  }, [year]);

  return (
    <div style={{ height: 640 }}>
      <GeovisWorkspace
        config={config}
        visualizationSpec={spec}
        variables={selection}
        onVariableChange={setSelection}
      />
    </div>
  );
};

const meta = {
  title: 'Geovis Workspace/TimelineCrossfade',
  component: TimelineCrossfadeDemo,
  tags: ['autodocs'],
  decorators: [withPtBr],
} satisfies Meta<typeof TimelineCrossfadeDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Scrub or play the timeline; each year change crossfades the points. */
export const TimelineDrivenCrossfade: Story = {};
