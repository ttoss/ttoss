import { resolveIntentOverallStatus } from 'src/intent/intentResult';
import { INTENT_SCHEMA_VERSION } from 'src/intent/schema';
import { validateIntent } from 'src/intent/validateIntent';

import { sampleCatalog } from '../../fixtures/sampleCatalog';
import { sampleCatalogWithSensibleFilter } from '../../fixtures/sampleCatalogWithSensibleFilter';
import { minimalIntent } from '../../fixtures/sampleIntents';

describe('validateIntent — happy path', () => {
  test('a datasetId-supplied intent, confirmed against the catalog, resolves valid', () => {
    const result = validateIntent(
      {
        ...minimalIntent,
        datasetId: 'dataset-demografia-municipio',
      },
      sampleCatalog
    );
    expect(result.status).toBe('valid');
    if (result.status === 'valid') {
      expect(result.datasetId).toBe('dataset-demografia-municipio');
      expect(result.catalogVersion).toBe(sampleCatalog.version);
    }
  });

  test('a datasetId-omitted intent that unambiguously joins one dataset resolves valid, with datasetId inferred (D9)', () => {
    const result = validateIntent(
      {
        schemaVersion: INTENT_SCHEMA_VERSION,
        analyticalTask: 'coverage',
        metricId: 'metric-classe-uso-solo',
        geographyId: 'geo-h3-grid',
        categoryId: 'urbano',
      },
      sampleCatalog
    );
    expect(result.status).toBe('valid');
    if (result.status === 'valid') {
      expect(result.datasetId).toBe('dataset-uso-solo-h3');
    }
  });

  test('a filter grounded via a sourceDatasetId-scoped FilterField validates', () => {
    const result = validateIntent(
      {
        ...minimalIntent,
        datasetId: 'dataset-demografia-municipio',
        filters: [{ field: 'filter-populacao', op: 'gte', value: 100 }],
      },
      sampleCatalog
    );
    expect(result.status).toBe('valid');
  });

  test('a filter grounded via a sourceGeographyId-scoped FilterField validates', () => {
    const result = validateIntent(
      {
        ...minimalIntent,
        datasetId: 'dataset-demografia-municipio',
        filters: [{ field: 'filter-regiao', op: 'in', value: ['sul'] }],
      },
      sampleCatalog
    );
    expect(result.status).toBe('valid');
  });

  test('a denominatorMetricId that resolves and differs from metricId validates (D7 happy path)', () => {
    const result = validateIntent(
      {
        ...minimalIntent,
        datasetId: 'dataset-demografia-municipio',
        denominatorMetricId: 'metric-densidade-populacional',
      },
      sampleCatalog
    );
    expect(result.status).toBe('valid');
  });
});

describe('validateIntent — error handling', () => {
  test('invalid-intent-schema: a non-object input fails shape validation with no repair', () => {
    const result = validateIntent('not an intent', sampleCatalog);
    expect(result.status).toBe('invalid');
    if (result.status !== 'valid') {
      expect(result.issues[0].code).toBe('invalid-intent-schema');
      expect(result.issues[0].repair).toBeUndefined();
    }
  });

  test('invalid-intent-schema-version: a mismatched schemaVersion suggests the set-value repair', () => {
    const result = validateIntent(
      { ...minimalIntent, schemaVersion: 999 },
      sampleCatalog
    );
    expect(result.status).toBe('invalid');
    if (result.status !== 'valid') {
      const issue = result.issues.find((candidate) => {
        return candidate.code === 'invalid-intent-schema-version';
      });
      expect(issue?.repair).toEqual([
        {
          kind: 'set-value',
          path: '/schemaVersion',
          value: INTENT_SCHEMA_VERSION,
          label: `Set schemaVersion to ${INTENT_SCHEMA_VERSION}`,
        },
      ]);
    }
  });

  test('unknown-metric: repair lists every catalog metric id', () => {
    const result = validateIntent(
      { ...minimalIntent, metricId: 'does-not-exist' },
      sampleCatalog
    );
    expect(result.status).toBe('mismatch');
    if (result.status !== 'valid') {
      const issue = result.issues.find((candidate) => {
        return candidate.code === 'unknown-metric';
      });
      expect(issue?.repair?.[0]).toMatchObject({ kind: 'allowed-values' });
      expect(issue?.repair?.[0]).toHaveProperty(
        'values',
        expect.arrayContaining(['metric-populacao'])
      );
    }
  });

  test('unknown-geography: repair lists every catalog geography id', () => {
    const result = validateIntent(
      { ...minimalIntent, geographyId: 'does-not-exist' },
      sampleCatalog
    );
    expect(result.status).toBe('mismatch');
    if (result.status !== 'valid') {
      expect(result.issues[0].code).toBe('unknown-geography');
    }
  });

  test('dataset-metric-mismatch: a supplied datasetId whose metricIds excludes the requested metric', () => {
    const result = validateIntent(
      {
        ...minimalIntent,
        metricId: 'metric-distancia-hospital',
        datasetId: 'dataset-demografia-municipio',
      },
      sampleCatalog
    );
    expect(result.status).toBe('mismatch');
    if (result.status !== 'valid') {
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].code).toBe('dataset-metric-mismatch');
    }
  });

  test('dataset-geography-mismatch: a supplied datasetId whose geographyIds excludes the requested geography', () => {
    const result = validateIntent(
      {
        ...minimalIntent,
        geographyId: 'geo-uf',
        datasetId: 'dataset-demografia-municipio',
      },
      sampleCatalog
    );
    expect(result.status).toBe('mismatch');
    if (result.status !== 'valid') {
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].code).toBe('dataset-geography-mismatch');
    }
  });

  test('a datasetId that does not exist at all fails both dataset-metric-mismatch and dataset-geography-mismatch', () => {
    const result = validateIntent(
      { ...minimalIntent, datasetId: 'dataset-does-not-exist' },
      sampleCatalog
    );
    expect(result.status).toBe('mismatch');
    if (result.status !== 'valid') {
      const codes = result.issues.map((issue) => {
        return issue.code;
      });
      expect(codes).toEqual(
        expect.arrayContaining([
          'dataset-metric-mismatch',
          'dataset-geography-mismatch',
        ])
      );
    }
  });

  test('unknown-category: absent categoryId on a nominal metric', () => {
    const result = validateIntent(
      {
        ...minimalIntent,
        metricId: 'metric-classe-uso-solo',
        geographyId: 'geo-h3-grid',
      },
      sampleCatalog
    );
    expect(result.status).toBe('mismatch');
    if (result.status !== 'valid') {
      const issue = result.issues.find((candidate) => {
        return candidate.code === 'unknown-category';
      });
      expect(issue?.repair?.[0]).toHaveProperty(
        'values',
        expect.arrayContaining(['urbano', 'rural', 'preservacao'])
      );
    }
  });

  test("unknown-category: categoryId present but not in the metric's category list", () => {
    const result = validateIntent(
      {
        ...minimalIntent,
        metricId: 'metric-classe-uso-solo',
        geographyId: 'geo-h3-grid',
        categoryId: 'inexistente',
      },
      sampleCatalog
    );
    expect(result.status).toBe('mismatch');
    if (result.status !== 'valid') {
      expect(result.issues[0].code).toBe('unknown-category');
    }
  });

  test('a categoryId on a non-nominal metric is inert, not an error (D6)', () => {
    const result = validateIntent(
      {
        ...minimalIntent,
        datasetId: 'dataset-demografia-municipio',
        categoryId: 'urbano',
      },
      sampleCatalog
    );
    expect(result.status).toBe('valid');
  });

  test('unknown-denominator-metric: an id absent from the catalog', () => {
    const result = validateIntent(
      { ...minimalIntent, denominatorMetricId: 'does-not-exist' },
      sampleCatalog
    );
    expect(result.status).toBe('mismatch');
    if (result.status !== 'valid') {
      expect(result.issues[0].code).toBe('unknown-denominator-metric');
    }
  });

  test('unknown-denominator-metric: a denominator equal to metricId (a metric divided by itself)', () => {
    const result = validateIntent(
      {
        ...minimalIntent,
        denominatorMetricId: minimalIntent.metricId,
      },
      sampleCatalog
    );
    expect(result.status).toBe('mismatch');
    if (result.status !== 'valid') {
      expect(result.issues[0].code).toBe('unknown-denominator-metric');
    }
  });
});

describe('validateIntent — ambiguity and filter-field grounding (Phase 3)', () => {
  test('no-matching-dataset: zero datasets carry both the metric and the geography', () => {
    const result = validateIntent(
      {
        ...minimalIntent,
        metricId: 'metric-populacao',
        geographyId: 'geo-poi-equipamentos',
      },
      sampleCatalog
    );
    expect(result.status).toBe('mismatch');
    if (result.status !== 'valid') {
      expect(result.issues[0].code).toBe('no-matching-dataset');
    }
  });

  test('ambiguous-dataset: more than one dataset carries the metric+geography pair, repair lists every candidate', () => {
    const result = validateIntent(
      {
        ...minimalIntent,
        metricId: 'metric-populacao',
        geographyId: 'geo-municipio',
      },
      sampleCatalog
    );
    expect(result.status).toBe('needs-clarification');
    if (result.status !== 'valid') {
      expect(result.issues[0].code).toBe('ambiguous-dataset');
      expect(result.issues[0].repair?.[0]).toHaveProperty(
        'values',
        expect.arrayContaining([
          'dataset-demografia-municipio',
          'dataset-perfil-socioeconomico',
        ])
      );
    }
  });

  test('filters are not evaluated when the dataset stays ambiguous — no filter-grounding issue leaks in', () => {
    const result = validateIntent(
      {
        ...minimalIntent,
        metricId: 'metric-populacao',
        geographyId: 'geo-municipio',
        filters: [{ field: 'this-does-not-exist', op: 'eq', value: 'x' }],
      },
      sampleCatalog
    );
    expect(result.status).toBe('needs-clarification');
    if (result.status !== 'valid') {
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].code).toBe('ambiguous-dataset');
    }
  });

  test('unknown-filter-field: the field id does not exist in Catalog.filters[] at all', () => {
    const result = validateIntent(
      {
        ...minimalIntent,
        datasetId: 'dataset-demografia-municipio',
        filters: [{ field: 'does-not-exist', op: 'eq', value: 'x' }],
      },
      sampleCatalog
    );
    expect(result.status).toBe('mismatch');
    if (result.status !== 'valid') {
      const issue = result.issues.find((candidate) => {
        return candidate.code === 'unknown-filter-field';
      });
      expect(issue?.repair?.[0]).toHaveProperty(
        'values',
        expect.arrayContaining(['filter-ano', 'filter-populacao'])
      );
    }
  });

  test('unknown-filter-field: the field exists but is scoped to a different dataset/geography (D9 scope check)', () => {
    const result = validateIntent(
      {
        ...minimalIntent,
        datasetId: 'dataset-demografia-municipio',
        filters: [{ field: 'filter-distancia-hospital', op: 'lte', value: 10 }],
      },
      sampleCatalog
    );
    expect(result.status).toBe('mismatch');
    if (result.status !== 'valid') {
      expect(result.issues[0].code).toBe('unknown-filter-field');
    }
  });

  test('sensitive-filter-field: a FilterField.sensible: true entry fails with no repair', () => {
    const result = validateIntent(
      {
        ...minimalIntent,
        datasetId: 'dataset-demografia-municipio',
        filters: [{ field: 'filter-renda-domicilio', op: 'gte', value: 1000 }],
      },
      sampleCatalogWithSensibleFilter
    );
    expect(result.status).toBe('mismatch');
    if (result.status !== 'valid') {
      expect(result.issues[0].code).toBe('sensitive-filter-field');
      expect(result.issues[0].repair).toBeUndefined();
    }
  });

  test("unsupported-filter-operator: op is schema-valid but outside this field's declared operators (D10)", () => {
    const result = validateIntent(
      {
        ...minimalIntent,
        datasetId: 'dataset-demografia-municipio',
        filters: [{ field: 'filter-regiao', op: 'gt', value: 'x' }],
      },
      sampleCatalog
    );
    expect(result.status).toBe('mismatch');
    if (result.status !== 'valid') {
      expect(result.issues[0].code).toBe('unsupported-filter-operator');
      expect(result.issues[0].repair?.[0]).toHaveProperty('values', [
        'in',
        'not-in',
      ]);
    }
  });
});

describe('validateIntent — edge cases', () => {
  test('a nominal metric with no declared categories (bypassing catalog-level enforcement) still fails unknown-category, with an empty repair list rather than throwing', () => {
    const catalogWithUncategorizedNominalMetric = {
      ...sampleCatalog,
      metrics: [
        ...sampleCatalog.metrics,
        {
          id: 'metric-uncategorized-nominal',
          title: 'Nominal sem categorias',
          description:
            'Métrica nominal construída sem categories, para teste defensivo.',
          kind: 'nominal' as const,
          nullPolicy: 'hide' as const,
        },
      ],
    };
    const result = validateIntent(
      {
        ...minimalIntent,
        metricId: 'metric-uncategorized-nominal',
        categoryId: 'anything',
      },
      catalogWithUncategorizedNominalMetric
    );
    expect(result.status).toBe('mismatch');
    if (result.status !== 'valid') {
      const issue = result.issues.find((candidate) => {
        return candidate.code === 'unknown-category';
      });
      expect(issue?.repair?.[0]).toHaveProperty('values', []);
    }
  });

  test('multiple independent issues are collected in one pass, not short-circuited', () => {
    const result = validateIntent(
      {
        ...minimalIntent,
        metricId: 'does-not-exist',
        geographyId: 'also-does-not-exist',
      },
      sampleCatalog
    );
    expect(result.status).toBe('mismatch');
    if (result.status !== 'valid') {
      const codes = result.issues.map((issue) => {
        return issue.code;
      });
      expect(codes).toEqual(
        expect.arrayContaining(['unknown-metric', 'unknown-geography'])
      );
    }
  });

  test('an invalid schemaVersion combined with a mismatch issue reports overall status invalid (precedence)', () => {
    const result = validateIntent(
      { ...minimalIntent, schemaVersion: 999, metricId: 'does-not-exist' },
      sampleCatalog
    );
    expect(result.status).toBe('invalid');
    if (result.status !== 'valid') {
      const codes = result.issues.map((issue) => {
        return issue.code;
      });
      expect(codes).toEqual(
        expect.arrayContaining([
          'invalid-intent-schema-version',
          'unknown-metric',
        ])
      );
    }
  });
});

describe('validateIntent — identity invariant', () => {
  test('is referentially transparent: same input+catalog produce deep-equal results across calls', () => {
    const input = {
      ...minimalIntent,
      datasetId: 'dataset-demografia-municipio',
    };
    const first = validateIntent(input, sampleCatalog);
    const second = validateIntent(input, sampleCatalog);
    expect(second).toEqual(first);
  });

  test('never mutates the catalog it validates against', () => {
    const before = JSON.parse(JSON.stringify(sampleCatalog));
    validateIntent(
      { ...minimalIntent, datasetId: 'dataset-demografia-municipio' },
      sampleCatalog
    );
    expect(sampleCatalog).toEqual(before);
  });

  test("a 'valid' result's intent deep-equals what intentSchema itself would parse — no hidden transformation", () => {
    const input = {
      ...minimalIntent,
      datasetId: 'dataset-demografia-municipio',
    };
    const result = validateIntent(input, sampleCatalog);
    expect(result.status).toBe('valid');
    if (result.status === 'valid') {
      expect(result.intent).toEqual(input);
    }
  });
});

describe('resolveIntentOverallStatus — identity invariant', () => {
  test('the resolved status is independent of issue array order', () => {
    const issues = [
      {
        code: 'unknown-metric' as const,
        subject: { path: '/metricId' },
        message: 'x',
      },
      {
        code: 'invalid-intent-schema-version' as const,
        subject: { path: '/schemaVersion' },
        message: 'y',
      },
    ];
    const forward = resolveIntentOverallStatus(issues);
    const reversed = resolveIntentOverallStatus([...issues].reverse());
    expect(forward).toBe(reversed);
    expect(forward).toBe('invalid');
  });
});
