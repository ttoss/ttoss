/**
 * Contract tests for the `cluster-tiles` fixture behind the
 * `GeoVis/ClusterTiles` story.
 *
 * The story is the package's only example of styling a `vector-tiles` source
 * from the tiles' own attributes — no `mapData` join is possible there, since
 * tiled features carry no stable ids. These tests pin the three spec fields
 * that make it work, so a refactor of the translation layer cannot quietly
 * break the story into an empty map.
 */
import { toMaplibreLayer } from 'src/adapters/maplibre/layerTranslation';
import createMapLibreAdapter from 'src/adapters/maplibre/MapLibreAdapter';
import type { VisualizationLayer, VisualizationSpec } from 'src/spec/types';
import { validateSpec } from 'src/spec/validateSpec';

import clusterTiles from '../../../../src/fixtures/cluster-tiles.json';

const spec = clusterTiles as unknown as VisualizationSpec;

const issueMessage = (issue: { message: string }): string => {
  return issue.message;
};

const layerById = (id: string): VisualizationLayer => {
  const layer = spec.layers.find((candidate) => {
    return candidate.id === id;
  });
  if (!layer) throw new Error(`fixture has no layer '${id}'`);
  return layer;
};

const translate = (id: string) => {
  return toMaplibreLayer(layerById(id), 'clusters') as unknown as Record<
    string,
    unknown
  >;
};

describe('cluster-tiles fixture', () => {
  /**
   * Validated against the MapLibre adapter's own `CapabilitySet`, the way
   * `createRuntime` does it — the capability checks are exactly what a
   * bare `validateSpec(spec)` skips, and they are what rejects a filtered
   * `vector-tiles` layer. A spec that fails here renders nothing at all
   * (ADR-0001), so the story would come up as a blank map.
   */
  test('resolves against the adapter capabilities the runtime validates with', () => {
    const capabilities = createMapLibreAdapter().getCapabilities();
    const result = validateSpec(spec, capabilities);
    expect(
      result.status === 'resolved' ? [] : result.issues.map(issueMessage)
    ).toEqual([]);
  });

  test('sizes clusters from the tile attribute, not from feature-state', () => {
    const radius = (
      translate('cluster-small').paint as Record<string, unknown>
    )['circle-radius'];
    // `propertyName` without `mapDataId` compiles to a direct property read.
    expect(JSON.stringify(radius)).toContain('["get","count"]');
    expect(JSON.stringify(radius)).not.toContain('feature-state');
  });

  test('separates clusters from lone points by the accumulated count', () => {
    expect(translate('cluster-small').filter).toEqual([
      '>=',
      ['get', 'count'],
      2,
    ]);
    expect(translate('cluster-singles').filter).toEqual([
      '<',
      ['get', 'count'],
      2,
    ]);
  });

  test('labels each cluster with the MapLibre property token', () => {
    const layout = translate('cluster-labels').layout as Record<
      string,
      unknown
    >;
    expect(layout['text-field']).toBe('{count}');
  });

  /**
   * MapLibre validates `layout` on `addLayer` and rejects an explicit
   * `undefined` (`use null instead`), which throws out of the layer sync and
   * leaves the map empty. A text-only symbol layer must therefore not carry
   * the key at all.
   */
  test('omits icon-image on a symbol layer that declares no icon', () => {
    const layout = translate('cluster-labels').layout as Record<
      string,
      unknown
    >;
    expect(Object.keys(layout)).not.toContain('icon-image');
  });

  test('addresses the layer inside the tiles on every layer', () => {
    for (const layer of spec.layers) {
      expect(translate(layer.id)['source-layer']).toBe('clusters');
    }
  });
});
