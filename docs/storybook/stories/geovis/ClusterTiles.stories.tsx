import type { Meta, StoryFn } from '@storybook/react-webpack5';
import type { VisualizationSpec } from '@ttoss/geovis';
import { GeoVisCanvas, GeoVisProvider } from '@ttoss/geovis';
import * as React from 'react';

import clusterTilesSpec from '../../../../packages/geovis/src/fixtures/cluster-tiles.json';

export default {
  title: 'GeoVis/ClusterTiles',
  tags: ['autodocs'],
} as Meta;

/**
 * MapLibre resolves a `vector-tiles` template inside a Web Worker, where a
 * root-relative path has no base to resolve against — `new Request('/tiles/…')`
 * throws `Failed to parse URL` and the layer silently stays empty. GeoJSON
 * sources get away with relative paths because those are fetched on the main
 * thread. The fixture therefore stores the path and the story makes it absolute
 * at render time.
 */
const withAbsoluteTiles = (spec: VisualizationSpec): VisualizationSpec => {
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  return {
    ...spec,
    sources: spec.sources.map((source) => {
      return source.type === 'vector-tiles'
        ? {
            ...source,
            tiles: source.tiles.map((tile) => {
              return `${origin}${tile}`;
            }),
          }
        : source;
    }),
  };
};

/** Layer ids the story's controls toggle, keyed by the arg that drives them. */
const TOGGLEABLE = {
  showCounts: ['cluster-labels'],
  showLonePoints: ['cluster-singles'],
} as const;

type ClusterTilesArgs = {
  showCounts: boolean;
  showLonePoints: boolean;
};

/**
 * Clustering for a dataset too large to ship as GeoJSON.
 *
 * MapLibre's own `cluster: true` belongs to `geojson` sources: it runs
 * supercluster in the browser and therefore needs every point in memory. A
 * dataset that had to become tiles in the first place — millions of points —
 * can never satisfy that. The alternative this story demonstrates is to cluster
 * **when the tiles are generated**: `tippecanoe --cluster-distance` merges
 * neighbouring points per zoom level and writes the merged feature into the
 * pyramid, so the browser receives a handful of pre-aggregated circles instead
 * of a crowd of overlapping dots.
 *
 * The data is fictitious — 20,000 points around eight Brazilian capitals, built
 * by `packages/geovis/scripts/generateClusterFixtureTiles.ts`.
 *
 * # What the tiles carry, and what GeoVis reads from them
 *
 * Every input point is written with `count: 1`, and the generator passes
 * `--accumulate-attribute=count:sum`, so a merged feature reports how many
 * original points it stands for. `tippecanoe` also writes its own `point_count`
 * on each cluster, but that one counts the features merged **at that zoom
 * level**: since each level clusters the previous level's already-merged
 * features, a z2 circle covering 7,300 points reads `point_count: 128`. The
 * honest number is `count`, and that is what this spec sizes and labels by.
 *
 * Three spec fields carry the whole rendering, with no `mapData` join — none is
 * possible against a tiled source, whose features have no stable ids:
 *
 * - `propertyName: 'count'` with `sizeBy`, which compiles `circle-radius` to
 *   `['get', 'count']` instead of the feature-state path;
 * - `filter`, compiled to `['>=', ['get', 'count'], n]`, which separates
 *   clusters from lone points;
 * - `paint.textField: '{count}'`, whose token MapLibre expands per feature.
 *
 * # The rough edges this story exposes
 *
 * Colour cannot be driven by a tile attribute: `colorBy` and the legend
 * pipeline read feature-state, which is `geojson`-only. The four bands here are
 * four layers, each with a one-sided `count >= n` filter and a static colour,
 * stacked so the topmost match wins — a `LayerFilter` holds a single predicate,
 * so a closed range like `100 <= count < 1000` cannot be expressed at all.
 * Lone points are selected by `count < 2` rather than by the absence of
 * `point_count`, because the filter has no `has`/`not-has` operator.
 */
export const ClusterTiles: StoryFn<ClusterTilesArgs> = (args) => {
  const { showCounts, showLonePoints } = args;
  const spec = React.useMemo(() => {
    const hidden = new Set([
      ...(showCounts ? [] : TOGGLEABLE.showCounts),
      ...(showLonePoints ? [] : TOGGLEABLE.showLonePoints),
    ]);

    const base = withAbsoluteTiles(
      clusterTilesSpec as unknown as VisualizationSpec
    );

    return {
      ...base,
      layers: base.layers.map((layer) => {
        return hidden.has(layer.id) ? { ...layer, visible: false } : layer;
      }),
    };
  }, [showCounts, showLonePoints]);

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
      <p style={{ fontSize: 13, color: '#52525b', margin: 0 }}>
        Zoom in: each circle splits into the clusters of the next level, and the
        numbers add up to the parent&apos;s. Past z8 the pyramid stops and
        MapLibre over-zooms the last level — the demo is built for z2–z8, where
        clustering is what there is to see.
      </p>
    </div>
  );
};

ClusterTiles.args = {
  showCounts: true,
  showLonePoints: true,
};

ClusterTiles.argTypes = {
  showCounts: {
    control: 'boolean',
    description: 'Renders the `{count}` label layer over each cluster.',
  },
  showLonePoints: {
    control: 'boolean',
    description:
      'Renders the points that no cluster absorbed (`count < 2`), visible from z6 outwards.',
  },
};
