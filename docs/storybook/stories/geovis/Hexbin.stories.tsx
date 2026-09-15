import type { Meta, StoryFn } from '@storybook/react-webpack5';
import type {
  GeoJSONFeatureCollection,
  MapDataRow,
  VisualizationSpec,
} from '@ttoss/geovis';
import * as React from 'react';

import { GeoVisFixtureStory } from './GeoVisFixtureStory';
import {
  hexbin,
  insideBrazil,
  quantileBreaks,
  syntheticPoints,
} from './helpers/hexbin-helpers';
import type { Bbox } from './helpers/map-story-helpers';

/**
 * **Hexbin** — Brazil's territory tiled by a regular hexagonal grid, each cell
 * coloured by how many observations fell inside it.
 *
 * The technique comes from Carr et al. (1987): divide the plane into hexagonal
 * bins and count the points in each. It answers the choropleth's worst
 * structural flaw — in a choropleth a large polygon reads as more important
 * purely because it is large, and Brazilian municípios span three orders of
 * magnitude in area. Equal-area bins remove that bias entirely. What they cost
 * is recognition: the reader loses the outlines they navigate by.
 *
 * Nothing here is a new engine capability. A hexagon is a polygon, so this is a
 * `geojson` source, a `polygon` layer, a `mapData` join and a quantitative
 * `colorBy` — the same four pieces as any choropleth. What makes it a *hexbin*
 * is that the geometry is generated and the values are counted, not read from
 * an administrative file.
 *
 * The grid is clipped to Brazilian land, so the country's shape is drawn by the
 * cells themselves rather than by an outline over them. A cell that caught
 * observations is always kept, even where the clip would have cut it: the clip
 * shapes the silhouette, it never deletes data.
 *
 * The points are invented. A real dataset would invite reading the map for its
 * subject rather than for the technique.
 *
 * Two controls carry the lesson:
 * - **cellRadiusKm** resizes the cells. The grid always covers the same
 *   territory, so a smaller cell means more of them — and the counts fall with
 *   the area, which is why the class breaks are recomputed rather than fixed.
 *   Coarse, the pattern dissolves into a few flat cells; fine, every cell holds
 *   0 or 1 and the map becomes the scatter plot it was meant to summarise.
 * - **showPoints** draws the raw observations over the bins, so the counting
 *   step is visible rather than asserted.
 */
export default {
  title: 'GeoVis/Hexbin',
  tags: ['autodocs'],
} as Meta;

/** Brazil's mainland, rounded outward. Only walked — the grid is clipped to land. */
const BBOX: Bbox = [-74, -34, -34, 6];

/**
 * Default cell circumradius, centre to corner, in kilometres. Around 245 cells
 * over Brazil — enough for the invented blobs to read without the grid turning
 * into the point cloud it summarises.
 */
const DEFAULT_CELL_RADIUS_KM = 120;

/** Invented blob centres, loosely over the populated arc of the country. */
const CENTRES: [number, number][] = [
  [-46.6, -23.5],
  [-43.2, -22.9],
  [-38.5, -12.9],
  [-60.0, -3.1],
  [-49.3, -25.4],
];

// Kept to land: the bbox is a rectangle that reaches well into the Atlantic and
// into three neighbouring countries, and observations out there would bin into
// cells the clip has no reason to draw.
const POINTS = syntheticPoints({
  centres: CENTRES,
  perCentre: 220,
  scatter: 900,
  spread: 2.2,
  bbox: BBOX,
  seed: 20260914,
}).filter(insideBrazil);

/** Sequential blues: light reads as few, dark as many, with no hue change. */
const CLASS_COLORS = ['#C6DBEF', '#6BAED6', '#2171B5', '#08306B'];

/**
 * The palette trimmed to the classes the breaks actually produced.
 *
 * Quantile breaks collapse when counts tie, and at a fine cell radius most
 * cells hold 0 or 1 — so the ramp has to shrink with them. Both ends are always
 * kept: dropping the darkest would leave the densest cells reading as mid-range.
 */
const colorsFor = (thresholds: number[]): string[] => {
  const classes = thresholds.length + 1;
  if (classes >= CLASS_COLORS.length) return CLASS_COLORS;
  if (classes === 1) return [CLASS_COLORS[CLASS_COLORS.length - 1]];

  return Array.from({ length: classes }, (_, index) => {
    return CLASS_COLORS[
      Math.round((index * (CLASS_COLORS.length - 1)) / (classes - 1))
    ];
  });
};

/** Cells that caught nothing. Grey, so "none" never reads as "few". */
const EMPTY_COLOR = '#ECECEC';

const pointsSource: GeoJSONFeatureCollection = {
  type: 'FeatureCollection',
  features: POINTS.map((coordinates, index) => {
    return {
      type: 'Feature',
      id: `pt-${index}`,
      properties: {},
      geometry: { type: 'Point', coordinates },
    };
  }),
};

type HexbinStoryArgs = {
  cellRadiusKm: number;
  showPoints: boolean;
  fillOpacity: number;
};

const HexbinStory: StoryFn<HexbinStoryArgs> = (args) => {
  const { cellRadiusKm, showPoints, fillOpacity } = args;

  const spec = React.useMemo((): VisualizationSpec => {
    const cells = hexbin({
      points: POINTS,
      bbox: BBOX,
      radiusKm: cellRadiusKm,
    });

    // Recomputed per radius, not written down. Halving the cell size roughly
    // quarters every count, so breaks fixed at one radius would paint the whole
    // map a single colour at the next.
    const thresholds = quantileBreaks({
      counts: cells.map((cell) => {
        return cell.count;
      }),
      classes: CLASS_COLORS.length,
    });

    const grid: GeoJSONFeatureCollection = {
      type: 'FeatureCollection',
      features: cells.map((cell) => {
        return {
          type: 'Feature',
          // The join key lives in `properties`, NOT in the feature's top-level
          // `id`. MapLibre serialises GeoJSON through the vector-tile encoder,
          // whose spec allows only integer feature ids, so it runs a string id
          // through `parseInt` — and `'hex-3-5'` comes out `NaN`. The feature
          // then has no id, `setFeatureState` lands nowhere, and every cell
          // falls to the legend's no-data colour. Declaring `joinKey` below
          // sets MapLibre's `promoteId`, which resolves the id from the
          // property at query time and accepts arbitrary strings.
          properties: { count: cell.count, hexId: cell.id },
          geometry: { type: 'Polygon', coordinates: [cell.ring] },
        };
      }),
    };

    // Empty cells are deliberately left OUT of the join. A row of `value: 0`
    // would fall below the first threshold and paint them in the lightest
    // class — "caught nothing" reading as "caught a few", which is the one
    // thing the grey is there to prevent. With no row they resolve to the
    // legend's `defaultColor`, under the label "No observations".
    const rows: MapDataRow[] = cells
      .filter((cell) => {
        return cell.count > 0;
      })
      .map((cell) => {
        return { geometryId: cell.id, value: cell.count };
      });

    return {
      title: 'Hexbin — observations binned into an equal-area grid',
      description: `${POINTS.length} invented observations over ${cells.length} cells of ${cellRadiusKm} km, clipped to Brazilian land.`,
      engine: 'maplibre',
      sources: [
        { id: 'hexgrid', type: 'geojson', data: grid },
        { id: 'observations', type: 'geojson', data: pointsSource },
      ],
      layers: [
        {
          id: 'hexgrid-fill',
          sourceId: 'hexgrid',
          geometry: 'polygon',
          mapDataId: 'counts',
          activeLegendId: 'counts',
          paint: { fillOpacity, lineColor: '#FFFFFF', lineWidth: 0.4 },
        },
        // Declared after the grid so the observations sit on top of it, and
        // hidden rather than dropped so toggling the control does not reorder
        // the style.
        {
          id: 'observations-pts',
          sourceId: 'observations',
          geometry: 'point',
          visible: showPoints,
          paint: {
            circleColor: '#E4572E',
            circleRadius: 1.6,
            circleStrokeColor: '#FFFFFF',
            circleStrokeWidth: 0.3,
          },
        },
      ],
      mapData: [
        { mapDataId: 'counts', mapId: 'hexgrid', joinKey: 'hexId', data: rows },
      ],
      legends: [
        {
          id: 'counts',
          title: 'Observations per cell',
          subtitle: `Quantile classes over cells of ${cellRadiusKm} km.`,
          position: 'bottom-right',
          noDataLabel: 'No observations',
          colorBy: {
            type: 'quantitative',
            property: 'value',
            scale: 'threshold',
            thresholds,
            colors: colorsFor(thresholds),
            defaultColor: EMPTY_COLOR,
          },
        },
      ],
    };
  }, [cellRadiusKm, showPoints, fillOpacity]);

  return <GeoVisFixtureStory spec={spec} bbox={BBOX} />;
};

/** The territory tiled, each cell coloured by what it caught. */
export const Default: StoryFn<HexbinStoryArgs> = HexbinStory.bind({});
Default.args = {
  cellRadiusKm: DEFAULT_CELL_RADIUS_KM,
  showPoints: false,
  fillOpacity: 0.85,
};
Default.argTypes = {
  cellRadiusKm: {
    // Floor at 40 km on purpose: below it the clip's per-corner containment
    // test starts costing more than a drag step can absorb (~2100 cells at 40,
    // ~5300 at 25), and the slider stops feeling attached to the map.
    control: { type: 'range', min: 40, max: 400, step: 20 },
    description:
      'Cell circumradius, centre to corner, in kilometres. Smaller cells tile the same territory with more of them.',
  },
  showPoints: {
    control: 'boolean',
    description: 'Draw the raw observations over the bins.',
  },
  fillOpacity: { control: { type: 'range', min: 0.2, max: 1, step: 0.05 } },
};

/**
 * The same data with the observations drawn on top. Every dot sits inside
 * exactly one cell, which is the entire claim the technique makes.
 */
export const WithObservations: StoryFn<HexbinStoryArgs> = HexbinStory.bind({});
WithObservations.args = {
  cellRadiusKm: DEFAULT_CELL_RADIUS_KM,
  showPoints: true,
  fillOpacity: 0.6,
};
WithObservations.argTypes = Default.argTypes;
