import {
  type CardCatalogItem,
  type DashboardGridItem,
  filterCatalogForGrid,
  getCardSignature,
} from 'src/index';

describe('getCardSignature', () => {
  test('should return null for sectionDivider cards', () => {
    const card = { type: 'sectionDivider', title: 'Section A' };
    expect(getCardSignature(card)).toBeNull();
  });

  test('should prefer id when present', () => {
    const card = {
      id: 'abc-123',
      title: 'Revenue',
      numberType: 'number' as const,
      type: 'bigNumber' as const,
      sourceType: [{ source: 'api' as const }],
      data: {},
    };
    expect(getCardSignature(card)).toBe('id:abc-123');
  });

  test('should use metrics-based signature when id is missing and metrics exist', () => {
    const card = {
      id: '',
      title: 'Revenue',
      numberType: 'number' as const,
      type: 'bigNumber' as const,
      sourceType: [{ source: 'api' as const }],
      data: {},
      metrics: [{ api: ['revenue'] }],
    };
    const sig = getCardSignature(card);
    expect(sig).toContain('metrics:');
    expect(sig).toContain('revenue');
  });

  test('should fall back to type:title when id is missing and no metrics', () => {
    const card = {
      id: '',
      title: 'Total Revenue',
      numberType: 'number' as const,
      type: 'bigNumber' as const,
      sourceType: [{ source: 'api' as const }],
      data: {},
    };
    expect(getCardSignature(card)).toBe('type:bigNumber:Total Revenue');
  });

  test('should produce the same signature regardless of metrics key insertion order', () => {
    const card1 = {
      id: '',
      title: 'Revenue',
      numberType: 'number' as const,
      type: 'bigNumber' as const,
      sourceType: [{ source: 'api' as const }],
      data: {},
      metrics: [{ api: ['revenue'], meta: ['total_revenue'] }],
    };
    const card2 = {
      id: '',
      title: 'Revenue',
      numberType: 'number' as const,
      type: 'bigNumber' as const,
      sourceType: [{ source: 'api' as const }],
      data: {},
      metrics: [{ meta: ['total_revenue'], api: ['revenue'] }],
    };
    expect(getCardSignature(card1)).toBe(getCardSignature(card2));
  });

  test('should fall back to type:title when metrics array is empty', () => {
    const card = {
      id: '',
      title: 'CTR',
      numberType: 'percentage' as const,
      type: 'bigNumber' as const,
      sourceType: [{ source: 'api' as const }],
      data: {},
      metrics: [],
    };
    expect(getCardSignature(card)).toBe('type:bigNumber:CTR');
  });
});

describe('filterCatalogForGrid', () => {
  const makeCatalogItem = (
    overrides: Partial<CardCatalogItem['card']> & { title: string }
  ): CardCatalogItem => {
    return {
      w: 4,
      h: 2,
      card: {
        id: '',
        numberType: 'number' as const,
        type: 'bigNumber' as const,
        sourceType: [{ source: 'api' as const }],
        data: {},
        ...overrides,
      },
    };
  };

  const makeGridItem = (
    i: string,
    cardOverrides: Partial<DashboardGridItem['card']> & { title: string }
  ): DashboardGridItem => {
    return {
      i,
      x: 0,
      y: 0,
      w: 4,
      h: 2,
      card: {
        id: '',
        numberType: 'number' as const,
        type: 'bigNumber' as const,
        sourceType: [{ source: 'api' as const }],
        data: {},
        ...cardOverrides,
      },
    };
  };

  test('should exclude catalog items already in the grid', () => {
    const catalog = [
      makeCatalogItem({ title: 'Revenue', id: 'rev-1' }),
      makeCatalogItem({ title: 'CTR', id: 'ctr-1' }),
    ];
    const grid = [makeGridItem('card-1', { title: 'Revenue', id: 'rev-1' })];

    const result = filterCatalogForGrid(catalog, grid);
    expect(result).toHaveLength(1);
    expect(result[0].card.title).toBe('CTR');
  });

  test('should deduplicate catalog items', () => {
    const catalog = [
      makeCatalogItem({ title: 'Revenue', id: 'rev-1' }),
      makeCatalogItem({ title: 'Revenue', id: 'rev-1' }),
      makeCatalogItem({ title: 'CTR', id: 'ctr-1' }),
    ];
    const grid: DashboardGridItem[] = [];

    const result = filterCatalogForGrid(catalog, grid);
    expect(result).toHaveLength(2);
  });

  test('should not filter out sectionDivider cards', () => {
    const catalog: CardCatalogItem[] = [
      {
        w: 12,
        h: 1,
        card: { type: 'sectionDivider', title: 'Section A' },
      },
      makeCatalogItem({ title: 'Revenue', id: 'rev-1' }),
    ];
    const grid: DashboardGridItem[] = [
      {
        i: 'div-1',
        x: 0,
        y: 0,
        w: 12,
        h: 1,
        card: { type: 'sectionDivider', title: 'Section A' },
      },
    ];

    const result = filterCatalogForGrid(catalog, grid);
    // sectionDivider should still be in result
    expect(result).toHaveLength(2);
  });

  test('should not mutate inputs', () => {
    const catalog = [
      makeCatalogItem({ title: 'Revenue', id: 'rev-1' }),
      makeCatalogItem({ title: 'CTR', id: 'ctr-1' }),
    ];
    const grid = [makeGridItem('card-1', { title: 'Revenue', id: 'rev-1' })];

    const catalogCopy = [...catalog];
    const gridCopy = [...grid];

    filterCatalogForGrid(catalog, grid);

    expect(catalog).toEqual(catalogCopy);
    expect(grid).toEqual(gridCopy);
  });

  test('should return empty array when all catalog items are in the grid', () => {
    const catalog = [makeCatalogItem({ title: 'Revenue', id: 'rev-1' })];
    const grid = [makeGridItem('card-1', { title: 'Revenue', id: 'rev-1' })];

    const result = filterCatalogForGrid(catalog, grid);
    expect(result).toHaveLength(0);
  });

  test('should match by type:title fallback when no id', () => {
    const catalog = [makeCatalogItem({ title: 'Revenue' })];
    const grid = [makeGridItem('card-1', { title: 'Revenue' })];

    const result = filterCatalogForGrid(catalog, grid);
    expect(result).toHaveLength(0);
  });
});
