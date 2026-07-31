import { computeFilterDomain, getFilterControls } from 'src/filterControls';
import type { Catalog, FilterField } from 'src/schema/types';

import { sampleCatalog } from '../fixtures/sampleCatalog';

const findControl = (id: string) => {
  const control = getFilterControls(sampleCatalog).find((candidate) => {
    return candidate.id === id;
  });
  if (control === undefined) throw new Error(`no control for '${id}'`);
  return control;
};

describe('getFilterControls', () => {
  test('returns one control per declared filter, in declaration order', () => {
    const controls = getFilterControls(sampleCatalog);
    expect(
      controls.map((control) => {
        return control.id;
      })
    ).toEqual(
      sampleCatalog.filters.map((filter) => {
        return filter.id;
      })
    );
  });

  test('a multi-value categorical filter becomes a multi-select', () => {
    const control = findControl('filter-regiao');

    expect(control.control).toBe('multi-select');
    expect(control.label).toBe('Região');
    expect(control.property).toBe('regiao');
    expect(control.requiresData).toBe(true);
    expect(control.domain).toEqual({ mode: 'runtime' });
  });

  test('a single-value categorical filter becomes a plain select', () => {
    const catalog: Catalog = {
      ...sampleCatalog,
      filters: sampleCatalog.filters.map((filter) => {
        return filter.id === 'filter-regiao'
          ? { ...filter, multiple: undefined }
          : filter;
      }),
    };

    const [control] = getFilterControls(catalog);
    expect(control.control).toBe('select');
  });

  test('a numeric filter becomes a range slider and inherits unit and formatter from its metric', () => {
    const control = findControl('filter-populacao');
    const metric = sampleCatalog.metrics.find((candidate) => {
      return candidate.id === 'metric-populacao';
    });

    expect(control.control).toBe('range-slider');
    expect(control.domain).toEqual({ mode: 'runtime' });
    expect(control.unit).toBe(metric?.unit);
    expect(control.formatter).toBe(metric?.formatter);
  });

  test('a temporal filter becomes a date range', () => {
    const control = findControl('filter-ano');

    expect(control.control).toBe('date-range');
    expect(control.domain).toEqual({ mode: 'runtime' });
  });

  test('a runtime domain is flagged so the UI knows it must load data first', () => {
    const control = findControl('filter-distancia-hospital');

    expect(control.requiresData).toBe(true);
    expect(control.domain).toEqual({ mode: 'runtime' });
  });

  test('the source is resolved to the referenced label, for dataset and geography alike', () => {
    expect(findControl('filter-regiao').source).toEqual({
      kind: 'geography',
      id: 'geo-municipio',
      label: 'Município',
    });
    expect(findControl('filter-populacao').source).toEqual({
      kind: 'dataset',
      id: 'dataset-demografia-municipio',
      label: 'Demografia Municipal',
    });
  });

  test('a filter with no metric carries no unit or formatter', () => {
    const control = findControl('filter-regiao');
    expect(control.unit).toBeUndefined();
    expect(control.formatter).toBeUndefined();
  });

  test('an unresolvable source degrades to the raw id instead of throwing', () => {
    const catalog = {
      ...sampleCatalog,
      filters: [
        {
          ...sampleCatalog.filters[0],
          sourceGeographyId: 'geo-does-not-exist',
        },
        {
          ...sampleCatalog.filters[2],
          sourceDatasetId: 'dataset-does-not-exist',
        },
      ],
    } as Catalog;

    const [geographyControl, datasetControl] = getFilterControls(catalog);
    expect(geographyControl.source.label).toBe('geo-does-not-exist');
    expect(datasetControl.source.label).toBe('dataset-does-not-exist');
  });

  test('a filter declaring neither source resolves to an empty dataset reference', () => {
    const catalog = {
      ...sampleCatalog,
      filters: [
        {
          ...sampleCatalog.filters[0],
          sourceGeographyId: undefined,
          sourceDatasetId: undefined,
        },
      ],
    } as Catalog;

    expect(getFilterControls(catalog)[0].source).toEqual({
      kind: 'dataset',
      id: '',
      label: '',
    });
  });
});

describe('computeFilterDomain', () => {
  const categorical = sampleCatalog.filters[0];
  const temporal = sampleCatalog.filters[1];
  const numeric = sampleCatalog.filters[2];

  test('a categorical filter yields labelled, counted, alphabetically ordered options', () => {
    const domain = computeFilterDomain({
      filter: categorical,
      rows: [
        { regiao: 'Sul' },
        { regiao: 'Norte' },
        { regiao: 'Sul' },
        { regiao: 'Centro-Oeste' },
      ],
    });

    expect(domain).toEqual({
      mode: 'values',
      values: [
        { value: 'Centro-Oeste', label: 'Centro-Oeste', count: 1 },
        { value: 'Norte', label: 'Norte', count: 1 },
        { value: 'Sul', label: 'Sul', count: 2 },
      ],
    });
  });

  test('a numeric filter yields the observed bounds', () => {
    const domain = computeFilterDomain({
      filter: numeric,
      rows: [{ populacao: 120 }, { populacao: 4 }, { populacao: 9800 }],
    });

    expect(domain).toEqual({ mode: 'range', min: 4, max: 9800 });
  });

  test('a temporal filter yields the observed interval', () => {
    const domain = computeFilterDomain({
      filter: temporal,
      rows: [
        { ano: '2019-05-01' },
        { ano: '2011-01-01' },
        { ano: '2022-12-31' },
      ],
    });

    expect(domain).toEqual({
      mode: 'interval',
      start: '2011-01-01',
      end: '2022-12-31',
    });
  });

  test('values of the wrong type are skipped rather than coerced', () => {
    expect(
      computeFilterDomain({
        filter: numeric,
        rows: [
          { populacao: '12' },
          { populacao: 7 },
          { populacao: Number.NaN },
        ],
      })
    ).toEqual({ mode: 'range', min: 7, max: 7 });

    expect(
      computeFilterDomain({
        filter: categorical,
        rows: [{ regiao: null }, { regiao: { nested: true } }, { regiao: 3 }],
      })
    ).toEqual({ mode: 'values', values: [{ value: 3, label: '3', count: 1 }] });

    expect(
      computeFilterDomain({
        filter: temporal,
        rows: [{ ano: '' }, { ano: 2019 }],
      })
    ).toBeUndefined();
  });

  test('rows carrying nothing usable yield no domain at all', () => {
    const empty: ReadonlyArray<Record<string, unknown>> = [];

    expect(
      computeFilterDomain({ filter: categorical, rows: empty })
    ).toBeUndefined();
    expect(
      computeFilterDomain({ filter: numeric, rows: empty })
    ).toBeUndefined();
    expect(
      computeFilterDomain({ filter: temporal, rows: empty })
    ).toBeUndefined();
  });

  test('the computed domain is assignable back onto the filter it came from', () => {
    const domain = computeFilterDomain({
      filter: numeric,
      rows: [{ populacao: 1 }, { populacao: 2 }],
    });

    const resolved: FilterField = {
      ...numeric,
      domain: domain ?? numeric.domain,
    };
    expect(resolved.domain).toEqual({ mode: 'range', min: 1, max: 2 });
  });
});
