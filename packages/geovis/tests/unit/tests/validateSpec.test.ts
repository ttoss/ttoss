import { applyDefaults } from 'src/spec/applyDefaults';
import { validateSpec } from 'src/spec/validateSpec';

import distritosMinimal from '../../../src/fixtures/distritos-sp-populacao-idosa.minimal.json';
import geojsonUrlMapMinimal from '../../../src/fixtures/geojson-url-map.minimal.json';
import invalidChoroplethMinimal from '../../../src/fixtures/invalid-raw-count-choropleth.minimal.json';
import linkedMapChartMinimal from '../../../src/fixtures/linked-map-chart.minimal.json';
import mapWithSidePanelMinimal from '../../../src/fixtures/map-with-side-panel.minimal.json';
import singleMapMinimal from '../../../src/fixtures/single-map.minimal.json';
import splitCompareMinimal from '../../../src/fixtures/split-compare.minimal.json';

describe('validateSpec', () => {
  test.each([
    ['single-map', singleMapMinimal],
    ['geojson-url-map', geojsonUrlMapMinimal],
    ['invalid-raw-count-choropleth', invalidChoroplethMinimal],
    ['linked-map-chart', linkedMapChartMinimal],
    ['map-with-side-panel', mapWithSidePanelMinimal],
    ['split-compare', splitCompareMinimal],
    ['distritos-sp-populacao-idosa', distritosMinimal],
  ])(
    'fixture "%s" becomes valid after applyDefaults',
    (_name, minimalFixture) => {
      const result = validateSpec(applyDefaults(minimalFixture));

      expect(result.valid).toBe(true);
    }
  );

  test('returns errors for an invalid spec', () => {
    const result = validateSpec({ title: 'missing required fields' });

    expect(result.valid).toBe(false);

    if (!result.valid) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  describe('layer data-driven visuals', () => {
    const baseSpec = {
      id: 'layer-visuals',
      engine: 'maplibre',
      view: { center: [0, 0], zoom: 1 },
      data: [
        {
          id: 'src',
          kind: 'geojson-inline',
          geojson: {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                geometry: null,
                properties: { nm_subpref: 'SE', qt_area_me: 1 },
              },
            ],
          },
        },
      ],
    };

    test('accepts labelProperty and categorical colorBy', () => {
      const spec = {
        ...baseSpec,
        layers: [
          {
            id: 'l1',
            dataId: 'src',
            geometry: 'polygon',
            labelProperty: 'nm_subpref',
            colorBy: {
              type: 'categorical',
              property: 'nm_subpref',
              palette: 'Set3',
              defaultColor: '#cccccc',
            },
          },
        ],
      };

      const result = validateSpec(spec);

      expect(result.valid).toBe(true);
    });

    test('accepts quantitative colorBy with quantile scale', () => {
      const spec = {
        ...baseSpec,
        layers: [
          {
            id: 'l1',
            dataId: 'src',
            geometry: 'polygon',
            colorBy: {
              type: 'quantitative',
              property: 'qt_area_me',
              scale: 'quantile',
              bins: 5,
              palette: 'Viridis',
            },
          },
        ],
      };

      const result = validateSpec(spec);

      expect(result.valid).toBe(true);
    });

    test('accepts multiple legends with activeLegendId', () => {
      const spec = {
        ...baseSpec,
        layers: [
          {
            id: 'l1',
            dataId: 'src',
            geometry: 'polygon',
            labelProperty: 'nm_subpref',
            activeLegendId: 'by-area',
            legends: [
              {
                id: 'by-name',
                label: 'Subprefeitura',
                colorBy: {
                  type: 'categorical',
                  property: 'nm_subpref',
                  palette: 'Set3',
                },
              },
              {
                id: 'by-area',
                label: 'Área (m²)',
                colorBy: {
                  type: 'quantitative',
                  property: 'qt_area_me',
                  scale: 'quantile',
                  bins: 5,
                  palette: 'Viridis',
                },
              },
            ],
          },
        ],
      };

      const result = validateSpec(spec);

      expect(result.valid).toBe(true);
    });

    test('rejects colorBy with unknown discriminator', () => {
      const spec = {
        ...baseSpec,
        layers: [
          {
            id: 'l1',
            dataId: 'src',
            geometry: 'polygon',
            colorBy: {
              type: 'gradient',
              property: 'qt_area_me',
            },
          },
        ],
      };

      const result = validateSpec(spec);

      expect(result.valid).toBe(false);
    });

    test('rejects quantitative colorBy with invalid scale', () => {
      const spec = {
        ...baseSpec,
        layers: [
          {
            id: 'l1',
            dataId: 'src',
            geometry: 'polygon',
            colorBy: {
              type: 'quantitative',
              property: 'qt_area_me',
              scale: 'rainbow',
            },
          },
        ],
      };

      const result = validateSpec(spec);

      expect(result.valid).toBe(false);
    });
  });

  describe('layer property cross-checks against source features', () => {
    const makeSpec = (overrides: {
      /** When provided, builds a FeatureCollection with these properties. */
      featureProperties?: Record<string, unknown>;
      /** When true, uses a URL-based source (cross-check must be skipped). */
      urlSource?: boolean;
      labelProperty?: string;
      displayProperties?: string[];
      colorByProperty?: string;
      legendProperty?: string;
    }) => {
      const source: Record<string, unknown> = {
        id: 'src',
        kind: 'geojson-inline',
      };

      if (overrides.urlSource) {
        source.kind = 'geojson-url';
        source.url = 'https://example.com/data.geojson';
      } else {
        source.geojson = {
          type: 'FeatureCollection',
          features: overrides.featureProperties
            ? [
                {
                  type: 'Feature',
                  geometry: null,
                  properties: overrides.featureProperties,
                },
              ]
            : [],
        };
      }

      const layer: Record<string, unknown> = {
        id: 'l1',
        dataId: 'src',
        geometry: 'polygon',
      };

      if (overrides.labelProperty) {
        layer.labelProperty = overrides.labelProperty;
      }

      if (overrides.displayProperties) {
        layer.displayProperties = overrides.displayProperties;
      }

      if (overrides.colorByProperty) {
        layer.colorBy = {
          type: 'categorical',
          property: overrides.colorByProperty,
        };
      }

      if (overrides.legendProperty) {
        layer.legends = [
          {
            id: 'legend-1',
            colorBy: {
              type: 'categorical',
              property: overrides.legendProperty,
            },
          },
        ];
      }

      return {
        id: 'cross-check',
        engine: 'maplibre',
        view: { center: [0, 0], zoom: 1 },
        data: [source],
        layers: [layer],
      };
    };

    test('accepts properties present in the inline features', () => {
      const spec = makeSpec({
        featureProperties: { nm_subpref: 'SE', qt_area_me: 1 },
        labelProperty: 'nm_subpref',
        colorByProperty: 'qt_area_me',
        legendProperty: 'nm_subpref',
      });

      const result = validateSpec(spec);

      expect(result.valid).toBe(true);
    });

    test('rejects labelProperty absent from all features', () => {
      const spec = makeSpec({
        featureProperties: { nm_subpref: 'SE' },
        labelProperty: 'missing_prop',
      });

      const result = validateSpec(spec);

      expect(result.valid).toBe(false);

      if (!result.valid) {
        expect(result.errors.join('\n')).toContain('labelProperty');
        expect(result.errors.join('\n')).toContain('missing_prop');
      }
    });

    test('rejects colorBy.property absent from all features', () => {
      const spec = makeSpec({
        featureProperties: { nm_subpref: 'SE' },
        colorByProperty: 'qt_area_me',
      });

      const result = validateSpec(spec);

      expect(result.valid).toBe(false);

      if (!result.valid) {
        expect(result.errors.join('\n')).toContain('colorBy/property');
      }
    });

    test('rejects legends[].colorBy.property absent from all features', () => {
      const spec = makeSpec({
        featureProperties: { nm_subpref: 'SE' },
        legendProperty: 'ghost',
      });

      const result = validateSpec(spec);

      expect(result.valid).toBe(false);

      if (!result.valid) {
        expect(result.errors.join('\n')).toContain(
          'legends/0/colorBy/property'
        );
      }
    });

    test('accepts displayProperties present in the features', () => {
      const spec = makeSpec({
        featureProperties: { nm_distrit: 'SE', c1: 1, c2: 2 },
        displayProperties: ['c1', 'c2'],
      });

      const result = validateSpec(spec);

      expect(result.valid).toBe(true);
    });

    test('rejects displayProperties absent from all features', () => {
      const spec = makeSpec({
        featureProperties: { nm_distrit: 'SE', c1: 1 },
        displayProperties: ['missing'],
      });

      const result = validateSpec(spec);

      expect(result.valid).toBe(false);

      if (!result.valid) {
        expect(result.errors.join('\n')).toContain('displayProperties/0');
        expect(result.errors.join('\n')).toContain('missing');
      }
    });

    test('skips cross-check when the source data is a URL', () => {
      const spec = makeSpec({
        urlSource: true,
        labelProperty: 'any_prop',
        colorByProperty: 'any_other',
      });

      const result = validateSpec(spec);

      expect(result.valid).toBe(true);
    });
  });

  describe('layerTemplates cross-checks against source features', () => {
    const baseSpec = (displayProperties: string[]) => {
      return {
        id: 'tpl',
        engine: 'maplibre',
        view: { center: [0, 0], zoom: 1 },
        data: [
          {
            id: 'src',
            kind: 'geojson-inline',
            geojson: {
              type: 'FeatureCollection',
              features: [
                {
                  type: 'Feature',
                  geometry: null,
                  properties: { c1: 1, c2: 2 },
                },
              ],
            },
          },
        ],
        layers: [],
        layerTemplates: [
          {
            id: 'template',
            dataId: 'src',
            geometry: 'polygon',
            // properties omitted — displayProperties drives expansion
            displayProperties,
            labelProperty: 'c1',
          },
        ],
      };
    };

    test('accepts displayProperties present in the features', () => {
      const result = validateSpec(baseSpec(['c1', 'c2']));
      expect(result.valid).toBe(true);
    });

    test('rejects displayProperties absent from the features', () => {
      const result = validateSpec(baseSpec(['c1', 'missing']));
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors.join('\n')).toContain(
          '/layerTemplates/0/displayProperties/1'
        );
        expect(result.errors.join('\n')).toContain('missing');
      }
    });

    test('uses properties path when explicit properties field is provided', () => {
      const spec = {
        id: 'tpl',
        engine: 'maplibre',
        view: { center: [0, 0], zoom: 1 },
        data: [
          {
            id: 'src',
            kind: 'geojson-inline',
            geojson: {
              type: 'FeatureCollection',
              features: [
                {
                  type: 'Feature',
                  geometry: null,
                  properties: { c1: 1 },
                },
              ],
            },
          },
        ],
        layers: [],
        layerTemplates: [
          {
            id: 'template',
            dataId: 'src',
            geometry: 'polygon',
            properties: ['c1', 'missing'],
            displayProperties: ['c1'],
            labelProperty: 'c1',
          },
        ],
      };
      const result = validateSpec(spec);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors.join('\n')).toContain(
          '/layerTemplates/0/properties/1'
        );
        expect(result.errors.join('\n')).toContain('missing');
      }
    });
  });
});
