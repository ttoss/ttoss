import { resolveSpecFromMapType } from 'src/spec/mapTypeDefaults';
import { getProportionalCirclesAutoLegendId } from 'src/spec/mapTypeDefaults/proportionalCircles';
import type { VisualizationSpec } from 'src/spec/types';
import type { ProportionalCirclesConfig } from 'src/ui/GeoVisLegend.circles';
import {
  resolveLegend,
  shouldShowCircleItems,
} from 'src/ui/GeoVisLegend.utils';

const circleConfig: ProportionalCirclesConfig = {
  scaleMaxValue: 500_000,
  sizeBy: { range: [4, 16], transform: 'sqrt' },
};

const buildSpec = ({
  legendEnabled,
}: {
  legendEnabled?: boolean;
}): VisualizationSpec => {
  return {
    id: 'spec',
    engine: 'maplibre',
    legendEnabled,
    sources: [],
    layers: [
      {
        id: 'circles',
        sourceId: 'centroids',
        geometry: 'point',
        activeLegendId: 'gender',
        legends:
          legendEnabled === false
            ? [{ id: 'population-legend', title: 'Circle size = population' }]
            : undefined,
        sizeBy: { range: [4, 16], transform: 'sqrt' },
      },
    ],
    legends: [
      {
        id: 'gender',
        title: 'Gender',
        colorBy: {
          type: 'categorical',
          property: 'gender',
          mapping: { men: '#3b82f6', women: '#ec4899' },
        },
      },
      ...(legendEnabled === false
        ? []
        : [{ id: 'population-legend', title: 'Circle size = population' }]),
    ],
    mapData: [
      {
        mapDataId: 'population',
        mapId: 'circles',
        stateKey: 'total',
        dimension: 'size',
        data: [{ geometryId: 1, value: 100 }],
      },
    ],
  } as unknown as VisualizationSpec;
};

const buildProportionalCirclesInput = ({
  legendEnabled,
}: {
  legendEnabled?: boolean;
}): VisualizationSpec => {
  return {
    id: 'input',
    engine: 'maplibre',
    mapType: 'proportionalCircles',
    legendEnabled,
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
        title: 'population',
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

describe('legendEnabled: false suppresses only the auto-generated legend', () => {
  test('resolveLegend does not resolve the disabled auto legend from layer.legends', () => {
    const spec = buildSpec({ legendEnabled: false });
    expect(resolveLegend(spec, 'population-legend')).toBeUndefined();
  });

  test('resolveLegend keeps resolving user top-level legends when disabled', () => {
    const spec = buildSpec({ legendEnabled: false });
    expect(resolveLegend(spec, 'gender')?.id).toBe('gender');
  });

  test('resolveLegend keeps resolving user-authored layer legends when disabled', () => {
    const spec = buildSpec({ legendEnabled: false });
    spec.layers[0].legends = [
      ...(spec.layers[0].legends ?? []),
      { id: 'custom-layer-legend', title: 'User layer legend' },
    ];
    expect(resolveLegend(spec, 'custom-layer-legend')?.id).toBe(
      'custom-layer-legend'
    );
  });

  test('resolveLegend still falls back to layer.legends when legends are enabled', () => {
    const spec = buildSpec({});
    spec.legends = spec.legends?.filter((l) => {
      return l.id !== 'population-legend';
    });
    spec.layers[0].legends = [
      { id: 'population-legend', title: 'Circle size = population' },
    ];
    expect(resolveLegend(spec, 'population-legend')?.id).toBe(
      'population-legend'
    );
  });

  test('shouldShowCircleItems suppresses the auto size key when legendEnabled is false', () => {
    const spec = buildSpec({ legendEnabled: false });
    const gender = spec.legends?.[0];
    expect(shouldShowCircleItems(circleConfig, gender, spec)).toBe(false);
  });

  test('shouldShowCircleItems keeps circles on the colorBy-less legend when enabled', () => {
    const spec = buildSpec({ legendEnabled: true });
    const [gender, population] = spec.legends ?? [];
    expect(shouldShowCircleItems(circleConfig, gender, spec)).toBe(false);
    expect(shouldShowCircleItems(circleConfig, population, spec)).toBe(true);
  });
});

describe('auto legend id derivation', () => {
  test('derives `<mapDataId>-legend` from the first mapData entry', () => {
    const spec = buildProportionalCirclesInput({});
    expect(getProportionalCirclesAutoLegendId(spec)).toBe('population-legend');
  });

  test('falls back to `unknown-legend` without mapData', () => {
    const spec = buildProportionalCirclesInput({});
    spec.mapData = undefined;
    expect(getProportionalCirclesAutoLegendId(spec)).toBe('unknown-legend');
  });

  test('resolver uses the derived id for the auto legend (enabled)', () => {
    const resolved = resolveSpecFromMapType(
      buildProportionalCirclesInput({ legendEnabled: true })
    );
    const ids = resolved.legends?.map((l) => {
      return l.id;
    });
    expect(ids).toContain('population-legend');
  });

  test('disabled: layer-attached auto legend is not resolvable by the legend UI', () => {
    const resolved = resolveSpecFromMapType(
      buildProportionalCirclesInput({ legendEnabled: false })
    );
    expect(resolved.legends ?? []).toHaveLength(0);
    const layerLegendIds = resolved.layers.flatMap((l) => {
      return (l.legends ?? []).map((x) => {
        return x.id;
      });
    });
    expect(layerLegendIds).toContain('population-legend');
    expect(resolveLegend(resolved, 'population-legend')).toBeUndefined();
  });
});
