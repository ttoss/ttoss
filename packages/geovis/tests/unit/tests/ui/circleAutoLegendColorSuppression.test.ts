import { resolveSpecFromMapType } from 'src/spec/mapTypeDefaults';
import { getProportionalCirclesAutoLegendId } from 'src/spec/mapTypeDefaults/proportionalCircles';
import type { VisualizationSpec } from 'src/spec/types';
import {
  buildColorItems,
  resolveLegend,
  shouldShowColorItems,
} from 'src/ui/GeoVisLegend.utils';

const buildProportionalCirclesSpec = (): VisualizationSpec => {
  return {
    id: 'input',
    engine: 'maplibre',
    mapType: 'proportionalCircles',
    scaleMaxValue: 500_000,
    sources: [
      {
        id: 'centroids',
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      },
    ],
    layers: [],
    mapData: [
      {
        mapDataId: 'population',
        mapId: 'centroids',
        stateKey: 'total',
        dimension: 'size',
        data: [
          { geometryId: 1, value: 100 },
          { geometryId: 2, value: 400 },
        ],
      },
    ],
  } as unknown as VisualizationSpec;
};

describe('the proportionalCircles auto legend never renders colorBy value bands', () => {
  test('the resolver still attaches a colorBy to the auto legend (needed for circle-color painting)', () => {
    const resolved = resolveSpecFromMapType(buildProportionalCirclesSpec());
    const autoLegendId = getProportionalCirclesAutoLegendId(resolved);
    const autoLegend = resolveLegend(resolved, autoLegendId);
    expect(autoLegend?.colorBy).toBeDefined();
  });

  test('shouldShowColorItems is false for the auto legend despite its colorBy', () => {
    const resolved = resolveSpecFromMapType(buildProportionalCirclesSpec());
    const autoLegendId = getProportionalCirclesAutoLegendId(resolved);
    const autoLegend = resolveLegend(resolved, autoLegendId);
    expect(shouldShowColorItems(autoLegend, resolved)).toBe(false);
  });

  test('buildColorItems is skipped by callers for the auto legend, so no value-band rows are produced', () => {
    const resolved = resolveSpecFromMapType(buildProportionalCirclesSpec());
    const autoLegendId = getProportionalCirclesAutoLegendId(resolved);
    const autoLegend = resolveLegend(resolved, autoLegendId);

    const items = shouldShowColorItems(autoLegend, resolved)
      ? buildColorItems(autoLegend, [], (v) => {
          return `${v}`;
        })
      : [];

    expect(items).toEqual([]);
  });

  test('shouldShowColorItems stays true for a regular, user-authored color legend', () => {
    const resolved = resolveSpecFromMapType(buildProportionalCirclesSpec());
    const userColorLegend = {
      id: 'gender',
      title: 'Gender',
      colorBy: {
        type: 'categorical' as const,
        property: 'gender',
        mapping: { men: '#3b82f6', women: '#ec4899' },
      },
    };
    expect(shouldShowColorItems(userColorLegend, resolved)).toBe(true);
  });
});
