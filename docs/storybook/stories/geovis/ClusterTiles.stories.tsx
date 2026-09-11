import type { Meta, StoryFn } from '@storybook/react-webpack5';
import type { VisualizationSpec } from '@ttoss/geovis';
import { GeoVisCanvas, GeoVisProvider, useGeoVis } from '@ttoss/geovis';
import type { Map as MapLibreMap, MapMouseEvent } from 'maplibre-gl';
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

/**
 * The circles a click drills into: the three count bands, which stand for more
 * than one point and therefore have something to split into.
 *
 * `cluster-singles` is left out because a lone point is not an aggregate of
 * anything, and `cluster-labels` because it sits above the circles — a handler
 * there would swallow the click aimed at the circle under the number.
 */
const DRILLABLE = ['cluster-small', 'cluster-medium', 'cluster-large'];

/** How long one drill step takes, in milliseconds. */
const DRILL_DURATION_MS = 800;

/**
 * Zooms into the clicked cluster until it splits, one pyramid level per click.
 *
 * `Math.floor(zoom) + 1` rather than a fixed step: `tippecanoe` re-clusters at
 * every integer zoom, so the next integer IS the next level at which this
 * circle becomes several — which is the whole promise of the gesture. The cap
 * is the source's own `maxzoom`; past it the pyramid stops and over-zooming
 * splits nothing, so the click goes quiet instead of pretending.
 *
 * Driven off the native map rather than `layer.click.onSelect`, for two reasons
 * that are worth knowing before copying this into an app:
 *
 * - `onSelect` never fires here. The runtime drops any click whose feature has
 *   no `id`, and `tippecanoe` writes none unless asked (`--generate-ids`); the
 *   cluster fixture does not ask.
 * - `MapClickInfo` carries no `properties` and no camera state, so neither the
 *   current zoom nor a feature attribute is reachable from it.
 *
 * The pointer cursor is NOT set here: the layers declare `click: {}` below,
 * which is what geovis reads to paint it. Writing the cursor from this effect
 * would lose anyway — `useMapHover` is mounted by `GeoVisProvider`, a parent,
 * so its global `mousemove` handler is registered afterwards and overwrites it.
 */
const ClusterDrilldown = () => {
  const { runtime, spec } = useGeoVis();

  const maxZoom = React.useMemo(() => {
    const tiled = spec.sources.find((source) => {
      return source.type === 'vector-tiles';
    });
    return tiled?.maxzoom;
  }, [spec.sources]);

  React.useEffect(() => {
    if (!runtime) return;

    const map = runtime.getAdapter().getNativeInstance() as MapLibreMap | null;
    if (!map) return;

    const handleClick = (event: MapMouseEvent) => {
      const layers = DRILLABLE.filter((layerId) => {
        return map.getLayer(layerId) !== undefined;
      });
      if (layers.length === 0) return;

      const [feature] = map.queryRenderedFeatures(event.point, { layers });
      if (!feature || feature.geometry.type !== 'Point') return;

      const current = map.getZoom();
      const next = Math.floor(current) + 1;
      const target = maxZoom === undefined ? next : Math.min(next, maxZoom);
      if (target <= current) return;

      const [longitude, latitude] = feature.geometry.coordinates;

      map.easeTo({
        center: [longitude, latitude],
        zoom: target,
        duration: DRILL_DURATION_MS,
        // MapLibre turns any animated move into an instant jump while the
        // reader's system asks for reduced motion, unless the move says it is
        // essential — and here the animation is the content: it is what shows
        // the cluster coming apart.
        essential: true,
      });
    };

    map.on('click', handleClick);

    return () => {
      map.off('click', handleClick);
    };
  }, [runtime, maxZoom]);

  return null;
};

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
 *
 * # Clicking a cluster to open it
 *
 * A click on any of the three band circles flies the camera to the next pyramid
 * level, centred on the cluster — the gesture the zoom control performs by hand.
 * Two library edges shape how it is wired, and both are worth knowing before
 * copying the pattern:
 *
 * - the spec-driven `layer.click.onSelect` never fires against these tiles. The
 *   runtime drops any click whose feature carries no `id`, and `tippecanoe`
 *   writes none without `--generate-ids`;
 * - `MapClickInfo` exposes no `properties` and no camera state, so a reaction
 *   that needs either — this one needs the current zoom — cannot read it there.
 *
 * So the reaction runs on the native map (`ClusterDrilldown`) while the layers
 * carry an empty `click: {}`, which is the flag geovis reads to paint the
 * pointer cursor. Splitting it that way is not a workaround for its own sake:
 * the cursor CANNOT be set from the effect, because `useMapHover` is mounted by
 * `GeoVisProvider` and its global `mousemove` handler runs after anything a
 * child writes.
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
        // `click: {}` and nothing inside it: geovis paints a pointer cursor for
        // every layer carrying a `click`, while only an `onSelect` within it
        // registers the runtime's own click path — which cannot serve this
        // interaction (see `ClusterDrilldown`). So the layer declares the
        // affordance and `ClusterDrilldown` supplies the reaction.
        const withAffordance = DRILLABLE.includes(layer.id)
          ? { ...layer, click: {} }
          : layer;

        return hidden.has(layer.id)
          ? { ...withAffordance, visible: false }
          : withAffordance;
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
          <ClusterDrilldown />
        </GeoVisProvider>
      </div>
      <p style={{ fontSize: 13, color: '#52525b', margin: 0 }}>
        Click a circle: the camera flies to the next pyramid level, where that
        circle has become several whose numbers add up to it. Lone points do not
        answer — there is nothing under them to split. Zooming by hand does the
        same thing more slowly. Past z8 the pyramid stops and MapLibre
        over-zooms the last level, so the click goes quiet there — the demo is
        built for z2–z8, where clustering is what there is to see.
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
