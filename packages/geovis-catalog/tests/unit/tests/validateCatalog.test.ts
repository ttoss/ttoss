import type { Catalog } from 'src/schema/types';
import { validateCatalog } from 'src/validateCatalog';

import { sampleCatalog } from '../fixtures/sampleCatalog';

describe('validateCatalog', () => {
  test('a valid catalog returns { status: "valid" }', () => {
    const result = validateCatalog(sampleCatalog);
    expect(result.status).toBe('valid');
    if (result.status === 'valid') {
      expect(result.catalog).toEqual(sampleCatalog);
    }
  });

  test('invalid-catalog-schema: a non-object input fails schema validation with no repair', () => {
    const result = validateCatalog({ not: 'a catalog' });
    expect(result.status).toBe('invalid');
    if (result.status !== 'valid') {
      expect(result.issues[0].code).toBe('invalid-catalog-schema');
      expect(result.issues[0].repair).toBeUndefined();
    }
  });

  test('duplicate-metric-id: two metrics sharing an id fail with no repair', () => {
    const catalog: Catalog = {
      ...sampleCatalog,
      metrics: [...sampleCatalog.metrics, sampleCatalog.metrics[0]],
    };
    const result = validateCatalog(catalog);
    expect(result.status).toBe('invalid');
    if (result.status !== 'valid') {
      const issue = result.issues.find((i) => {
        return i.code === 'duplicate-metric-id';
      });
      expect(issue).toBeDefined();
      expect(issue?.repair).toBeUndefined();
    }
  });

  test('duplicate-dataset-id: two datasets sharing an id fail', () => {
    const catalog: Catalog = {
      ...sampleCatalog,
      datasets: [...sampleCatalog.datasets, sampleCatalog.datasets[0]],
    };
    const result = validateCatalog(catalog);
    expect(result.status).toBe('invalid');
    if (result.status !== 'valid') {
      expect(
        result.issues.some((i) => {
          return i.code === 'duplicate-dataset-id';
        })
      ).toBe(true);
    }
  });

  test('duplicate-geography-id: two geographies sharing an id fail', () => {
    const catalog: Catalog = {
      ...sampleCatalog,
      geographies: [...sampleCatalog.geographies, sampleCatalog.geographies[0]],
    };
    const result = validateCatalog(catalog);
    expect(result.status).toBe('invalid');
    if (result.status !== 'valid') {
      expect(
        result.issues.some((i) => {
          return i.code === 'duplicate-geography-id';
        })
      ).toBe(true);
    }
  });

  test('unknown-join-dataset: a join referencing a non-existent dataset is a mismatch with allowed-values repair', () => {
    const catalog: Catalog = {
      ...sampleCatalog,
      joins: [
        {
          from: 'does-not-exist',
          to: 'geo-municipio',
          on: { left: 'a', right: 'b' },
          cardinality: '1:1',
        },
      ],
    };
    const result = validateCatalog(catalog);
    expect(result.status).toBe('mismatch');
    if (result.status !== 'valid') {
      const issue = result.issues.find((i) => {
        return i.code === 'unknown-join-dataset';
      });
      expect(issue?.repair).toEqual([
        {
          kind: 'allowed-values',
          path: 'joins[0].from',
          values: sampleCatalog.datasets.map((d) => {
            return d.id;
          }),
        },
      ]);
    }
  });

  test('unknown-join-geography: a join referencing a non-existent geography is a mismatch with allowed-values repair', () => {
    const catalog: Catalog = {
      ...sampleCatalog,
      joins: [
        {
          from: 'dataset-demografia-municipio',
          to: 'does-not-exist',
          on: { left: 'a', right: 'b' },
          cardinality: '1:1',
        },
      ],
    };
    const result = validateCatalog(catalog);
    expect(result.status).toBe('mismatch');
    if (result.status !== 'valid') {
      expect(
        result.issues.some((i) => {
          return i.code === 'unknown-join-geography';
        })
      ).toBe(true);
    }
  });

  test('unknown-dataset-geography: a dataset naming a non-existent geography is a mismatch', () => {
    const catalog: Catalog = {
      ...sampleCatalog,
      datasets: [
        {
          ...sampleCatalog.datasets[0],
          geographyIds: ['does-not-exist'],
        },
        ...sampleCatalog.datasets.slice(1),
      ],
    };
    const result = validateCatalog(catalog);
    expect(result.status).toBe('mismatch');
    if (result.status !== 'valid') {
      const issue = result.issues.find((i) => {
        return i.code === 'unknown-dataset-geography';
      });
      expect(issue).toBeDefined();
      expect(issue?.repair?.[0].kind).toBe('allowed-values');
    }
  });

  test('unknown-dataset-metric: a dataset naming a non-existent metric is a mismatch', () => {
    const catalog: Catalog = {
      ...sampleCatalog,
      datasets: [
        {
          ...sampleCatalog.datasets[0],
          metricIds: ['does-not-exist'],
        },
        ...sampleCatalog.datasets.slice(1),
      ],
    };
    const result = validateCatalog(catalog);
    expect(result.status).toBe('mismatch');
    if (result.status !== 'valid') {
      expect(
        result.issues.some((i) => {
          return i.code === 'unknown-dataset-metric';
        })
      ).toBe(true);
    }
  });

  test('unknown-parent-geography: a geography whose parentId names nothing is a mismatch', () => {
    const catalog: Catalog = {
      ...sampleCatalog,
      geographies: [
        { ...sampleCatalog.geographies[0], parentId: 'does-not-exist' },
        ...sampleCatalog.geographies.slice(1),
      ],
    };
    const result = validateCatalog(catalog);
    expect(result.status).toBe('mismatch');
    if (result.status !== 'valid') {
      const issue = result.issues.find((i) => {
        return i.code === 'unknown-parent-geography';
      });
      expect(issue).toBeDefined();
      expect(issue?.repair?.[0].kind).toBe('allowed-values');
    }
  });

  test('cyclic-geography-hierarchy: a two-node parentId cycle is a mismatch with no repair', () => {
    const catalog: Catalog = {
      ...sampleCatalog,
      geographies: [
        { ...sampleCatalog.geographies[0], id: 'geo-a', parentId: 'geo-b' },
        { ...sampleCatalog.geographies[1], id: 'geo-b', parentId: 'geo-a' },
        ...sampleCatalog.geographies.slice(2),
      ],
      // Datasets/joins reference geo-uf/geo-municipio, which no longer exist
      // after renaming above; drop them so this test isolates the cycle check.
      datasets: sampleCatalog.datasets.filter((dataset) => {
        return !dataset.geographyIds.some((id) => {
          return id === 'geo-uf' || id === 'geo-municipio';
        });
      }),
      joins: sampleCatalog.joins.filter((join) => {
        return join.to !== 'geo-uf' && join.to !== 'geo-municipio';
      }),
    };
    const result = validateCatalog(catalog);
    expect(result.status).toBe('mismatch');
    if (result.status !== 'valid') {
      const issue = result.issues.find((i) => {
        return i.code === 'cyclic-geography-hierarchy';
      });
      expect(issue).toBeDefined();
      expect(issue?.repair).toBeUndefined();
    }
  });

  test('a cycle reached from two different branches is reported once, not once per branch', () => {
    const catalog: Catalog = {
      ...sampleCatalog,
      geographies: [
        { ...sampleCatalog.geographies[0], id: 'geo-x', parentId: 'geo-a' },
        { ...sampleCatalog.geographies[0], id: 'geo-y', parentId: 'geo-a' },
        { ...sampleCatalog.geographies[0], id: 'geo-a', parentId: 'geo-b' },
        { ...sampleCatalog.geographies[1], id: 'geo-b', parentId: 'geo-a' },
        ...sampleCatalog.geographies.slice(2),
      ],
      datasets: sampleCatalog.datasets.filter((dataset) => {
        return !dataset.geographyIds.some((id) => {
          return id === 'geo-uf' || id === 'geo-municipio';
        });
      }),
      joins: sampleCatalog.joins.filter((join) => {
        return join.to !== 'geo-uf' && join.to !== 'geo-municipio';
      }),
    };
    const result = validateCatalog(catalog);
    expect(result.status).toBe('mismatch');
    if (result.status !== 'valid') {
      const cycleIssues = result.issues.filter((i) => {
        return i.code === 'cyclic-geography-hierarchy';
      });
      // Both geo-a and geo-b are each the re-entry point of their own walk
      // (one issue per distinct cycle member), but geo-x and geo-y's walks
      // funnel into the already-reported geo-a and must not add duplicates.
      expect(cycleIssues).toHaveLength(2);
      expect(
        cycleIssues.map((i) => {
          return i.subject.id;
        })
      ).toEqual(expect.arrayContaining(['geo-a', 'geo-b']));
    }
  });

  test('a valid 3-deep parentId chain (no cycle) validates cleanly', () => {
    const catalog: Catalog = {
      ...sampleCatalog,
      geographies: [
        { ...sampleCatalog.geographies[0], id: 'geo-country' },
        {
          ...sampleCatalog.geographies[0],
          id: 'geo-state',
          parentId: 'geo-country',
        },
        {
          ...sampleCatalog.geographies[0],
          id: 'geo-city',
          parentId: 'geo-state',
        },
        ...sampleCatalog.geographies.slice(2),
      ],
      datasets: sampleCatalog.datasets.filter((dataset) => {
        return !dataset.geographyIds.some((id) => {
          return id === 'geo-uf' || id === 'geo-municipio';
        });
      }),
      joins: sampleCatalog.joins.filter((join) => {
        return join.to !== 'geo-uf' && join.to !== 'geo-municipio';
      }),
    };
    const result = validateCatalog(catalog);
    expect(result.status).toBe('valid');
  });

  test('invalid takes precedence over mismatch when both are present', () => {
    const catalog: Catalog = {
      ...sampleCatalog,
      metrics: [...sampleCatalog.metrics, sampleCatalog.metrics[0]],
      joins: [
        {
          from: 'does-not-exist',
          to: 'geo-municipio',
          on: { left: 'a', right: 'b' },
          cardinality: '1:1',
        },
      ],
    };
    const result = validateCatalog(catalog);
    expect(result.status).toBe('invalid');
  });
});
