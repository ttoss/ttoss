import { expandLayerTemplates } from '../../../src/spec/expandLayerTemplates';
import type { VisualizationSpec } from '../../../src/spec/types';

const baseSpec = (): VisualizationSpec => {
  return {
    id: 'distritos',
    engine: 'maplibre',
    view: { center: [0, 0], zoom: 1 },
    metadata: {
      displayPropertyLabels: {
        c1: 'População 60 a 64',
        c2: 'População 65 a 69',
      },
    },
    data: [
      {
        id: 'src',
        kind: 'geojson-inline' as const,
        geojson: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: null,
              properties: { nm_distrit: 'SE', c1: 1, c2: 2 },
            },
          ],
        },
      },
    ],
    layers: [],
  };
};

describe('expandLayerTemplates', () => {
  test('returns spec as-is when there are no templates', () => {
    const spec = baseSpec();
    const result = expandLayerTemplates(spec);
    expect(result).toBe(spec);
  });

  test('expands one layer per property and injects colorBy.property', () => {
    const spec = baseSpec();
    spec.layerTemplates = [
      {
        id: 'distritos',
        dataId: 'src',
        geometry: 'polygon',
        properties: ['c1', 'c2'],
        labelProperty: 'nm_distrit',
        displayProperties: ['c1', 'c2'],
        colorBy: {
          type: 'quantitative',
          scale: 'quantile',
          bins: 5,
          palette: 'Blues',
        },
      },
    ];

    const result = expandLayerTemplates(spec);

    expect(result.layerTemplates).toBeUndefined();
    expect(result.layers).toHaveLength(2);

    const [l1, l2] = result.layers;
    expect(l1.id).toBe('distritos-c1');
    expect(l1.title).toBe('População 60 a 64');
    expect(l1.labelProperty).toBe('nm_distrit');
    expect(l1.displayProperties).toEqual(['c1', 'c2']);
    expect(l1.colorBy).toEqual({
      type: 'quantitative',
      property: 'c1',
      scale: 'quantile',
      bins: 5,
      palette: 'Blues',
    });

    expect(l2.id).toBe('distritos-c2');
    expect(l2.title).toBe('População 65 a 69');
    expect(l2.colorBy?.property).toBe('c2');
  });

  test('falls back to the property name as label when metadata is missing', () => {
    const spec = baseSpec();
    spec.metadata = {};
    spec.layerTemplates = [
      {
        id: 't',
        dataId: 'src',
        geometry: 'polygon',
        properties: ['c1'],
      },
    ];

    const result = expandLayerTemplates(spec);
    expect(result.layers[0].title).toBe('c1');
  });

  test('emits one view per expansion when generateViews is true', () => {
    const spec = baseSpec();
    spec.layerTemplates = [
      {
        id: 'grid',
        dataId: 'src',
        geometry: 'polygon',
        properties: ['c1', 'c2'],
        generateViews: true,
      },
    ];

    const result = expandLayerTemplates(spec);
    expect(result.views).toHaveLength(2);
    expect(result.views?.[0]).toEqual({
      id: 'grid-c1',
      label: 'População 60 a 64',
      layers: ['grid-c1'],
    });
    expect(result.views?.[1].layers).toEqual(['grid-c2']);
  });

  test('honours custom patterns with ${templateId} / ${property} / ${label}', () => {
    const spec = baseSpec();
    spec.layerTemplates = [
      {
        id: 'dist',
        dataId: 'src',
        geometry: 'polygon',
        properties: ['c1'],
        layerIdPattern: 'layer__${property}',
        viewIdPattern: 'view__${property}',
        labelPattern: '[${templateId}] ${label}',
        generateViews: true,
      },
    ];

    const result = expandLayerTemplates(spec);
    expect(result.layers[0].id).toBe('layer__c1');
    expect(result.layers[0].title).toBe('[dist] População 60 a 64');
    expect(result.views?.[0].id).toBe('view__c1');
  });

  test('preserves existing layers and views', () => {
    const spec = baseSpec();
    spec.layers = [{ id: 'existing', dataId: 'src', geometry: 'polygon' }];
    spec.views = [{ id: 'existing', layers: ['existing'] }];
    spec.layerTemplates = [
      {
        id: 't',
        dataId: 'src',
        geometry: 'polygon',
        properties: ['c1'],
        generateViews: true,
      },
    ];

    const result = expandLayerTemplates(spec);
    expect(
      result.layers.map((l) => {
        return l.id;
      })
    ).toEqual(['existing', 't-c1']);
    expect(
      result.views?.map((v) => {
        return v.id;
      })
    ).toEqual(['existing', 't-c1']);
  });

  test('generates views by default when generateViews is omitted', () => {
    const spec = baseSpec();
    spec.layerTemplates = [
      {
        id: 'default-views',
        dataId: 'src',
        geometry: 'polygon',
        properties: ['c1', 'c2'],
        labelProperty: 'nm_distrit',
        displayProperties: ['c1', 'c2'],
      },
    ];

    const result = expandLayerTemplates(spec);
    expect(
      result.views?.map((v) => {
        return v.id;
      })
    ).toEqual(['default-views-c1', 'default-views-c2']);
  });

  test('injects resolved displayPropertyLabels into each expanded layer', () => {
    const spec = baseSpec();
    spec.layerTemplates = [
      {
        id: 'labels',
        dataId: 'src',
        geometry: 'polygon',
        properties: ['c1'],
        labelProperty: 'nm_distrit',
        displayProperties: ['c1'],
      },
    ];

    const result = expandLayerTemplates(spec);
    // labelProperty is always included in the labels map so consumers can
    // render a friendly label for the header without a separate lookup.
    expect(result.layers[0].displayPropertyLabels).toEqual({
      nm_distrit: 'nm_distrit', // not in metadata → falls back to property name
      c1: 'População 60 a 64',
    });
  });

  test('falls back to displayProperties when properties is omitted', () => {
    const spec = baseSpec();
    spec.layerTemplates = [
      {
        id: 'distritos',
        dataId: 'src',
        geometry: 'polygon',
        labelProperty: 'nm_distrit',
        displayProperties: ['c1', 'c2'],
        colorBy: {
          type: 'quantitative',
          scale: 'quantile',
          bins: 5,
          palette: 'Blues',
        },
      },
    ];

    const result = expandLayerTemplates(spec);

    expect(result.layers).toHaveLength(2);
    expect(result.layers[0].id).toBe('distritos-c1');
    expect(result.layers[1].id).toBe('distritos-c2');
    expect(result.layers[0].colorBy?.property).toBe('c1');
    expect(result.layers[1].colorBy?.property).toBe('c2');
    expect(result.views).toHaveLength(2);
    expect(result.views?.[0].id).toBe('distritos-c1');
  });

  test('defaults id to template${i} and dataId to first data entry', () => {
    const spec = baseSpec();
    spec.layerTemplates = [
      {
        geometry: 'polygon',
        properties: ['c1', 'c2'],
        labelProperty: 'nm_distrit',
        displayProperties: ['c1', 'c2'],
      },
    ];

    const result = expandLayerTemplates(spec);
    // No template.id -> layerIdPattern omits the prefix.
    expect(
      result.layers.map((l) => {
        return l.id;
      })
    ).toEqual(['c1', 'c2']);
    expect(
      result.layers.every((l) => {
        return l.dataId === 'src';
      })
    ).toBe(true);
  });

  test('defaults colorBy to categorical with the current property', () => {
    const spec = baseSpec();
    spec.layerTemplates = [
      {
        geometry: 'polygon',
        properties: ['c1'],
        labelProperty: 'nm_distrit',
        displayProperties: ['c1'],
      },
    ];

    const result = expandLayerTemplates(spec);
    expect(result.layers[0].colorBy).toEqual({
      type: 'categorical',
      property: 'c1',
    });
  });

  test('preserves an explicit quantitative colorBy from the template', () => {
    const spec = baseSpec();
    spec.layerTemplates = [
      {
        geometry: 'polygon',
        properties: ['c1', 'c2'],
        labelProperty: 'nm_distrit',
        displayProperties: ['c1', 'c2'],
        colorBy: {
          type: 'quantitative',
          scale: 'quantile',
          bins: 5,
          palette: 'Blues',
        },
      },
    ];

    const result = expandLayerTemplates(spec);
    expect(result.layers[0].colorBy).toEqual({
      type: 'quantitative',
      property: 'c1',
      scale: 'quantile',
      bins: 5,
      palette: 'Blues',
    });
    expect(result.layers[1].colorBy).toMatchObject({
      type: 'quantitative',
      property: 'c2',
    });
  });

  describe('presentation propagation', () => {
    test('copies template.presentation to spec.presentation when not set', () => {
      const spec = baseSpec();
      spec.layerTemplates = [
        {
          id: 't',
          dataId: 'src',
          geometry: 'polygon',
          properties: ['c1'],
          presentation: 'side-by-side',
        },
      ];

      const result = expandLayerTemplates(spec);
      expect(result.presentation).toBe('side-by-side');
    });

    test('preserves spec.presentation over template.presentation', () => {
      const spec = baseSpec();
      spec.presentation = 'tabs';
      spec.layerTemplates = [
        {
          id: 't',
          dataId: 'src',
          geometry: 'polygon',
          properties: ['c1'],
          presentation: 'time-slider',
        },
      ];

      const result = expandLayerTemplates(spec);
      expect(result.presentation).toBe('tabs');
    });

    test('leaves spec.presentation undefined when neither set it', () => {
      const spec = baseSpec();
      spec.layerTemplates = [
        {
          id: 't',
          dataId: 'src',
          geometry: 'polygon',
          properties: ['c1'],
        },
      ];

      const result = expandLayerTemplates(spec);
      expect(result.presentation).toBeUndefined();
    });
  });
});
