import type { DashboardCard, SectionDivider } from 'src/index';
import {
  filterCatalogForGrid,
  getCardSignature,
} from 'src/utils/cardSignature';

describe('getCardSignature', () => {
  test('should return null for sectionDivider cards', () => {
    const card: SectionDivider = {
      type: 'sectionDivider',
      title: 'My Section',
    };
    expect(getCardSignature(card)).toBeNull();
  });

  test('should return id when card has an id', () => {
    const card = {
      id: 'abc-123',
      title: 'Revenue',
      type: 'bigNumber',
      numberType: 'number',
      sourceType: [{ source: 'api' }],
      data: {},
    } as DashboardCard;
    expect(getCardSignature(card)).toBe('abc-123');
  });

  test('should return metrics-based signature when card has metrics but no id', () => {
    const metrics = [{ api: ['revenue'] }];
    const card = {
      id: '',
      title: 'Revenue',
      type: 'bigNumber',
      numberType: 'number',
      sourceType: [{ source: 'api' }],
      data: {},
      metrics,
    } as unknown as DashboardCard;
    expect(getCardSignature(card)).toBe(`metrics:${JSON.stringify(metrics)}`);
  });

  test('should fall back to type:title when card has no id and no metrics', () => {
    const card = {
      id: '',
      title: 'Revenue',
      type: 'bigNumber',
      numberType: 'number',
      sourceType: [{ source: 'api' }],
      data: {},
    } as DashboardCard;
    expect(getCardSignature(card)).toBe('bigNumber:Revenue');
  });

  test('should fall back to type:title when metrics array is empty', () => {
    const card = {
      id: '',
      title: 'CTR',
      type: 'bigNumber',
      numberType: 'percentage',
      sourceType: [{ source: 'api' }],
      data: {},
      metrics: [],
    } as DashboardCard;
    expect(getCardSignature(card)).toBe('bigNumber:CTR');
  });

  test('should prefer id over metrics', () => {
    const card = {
      id: 'my-card-id',
      title: 'Revenue',
      type: 'bigNumber',
      numberType: 'number',
      sourceType: [{ source: 'api' }],
      data: {},
      metrics: [{ api: ['revenue'] }],
    } as unknown as DashboardCard;
    expect(getCardSignature(card)).toBe('my-card-id');
  });
});

describe('filterCatalogForGrid', () => {
  const makeCard = (overrides: Partial<DashboardCard> = {}): DashboardCard => {
    return {
      id: '',
      title: 'Card',
      type: 'bigNumber',
      numberType: 'number',
      sourceType: [{ source: 'api' }],
      data: {},
      ...overrides,
    } as DashboardCard;
  };

  test('should exclude catalog items whose card is already in the grid', () => {
    const card = makeCard({ id: 'card-1', title: 'Revenue' });
    const catalog = [{ w: 4, h: 2, card }];
    const grid = [{ i: 'grid-1', x: 0, y: 0, w: 4, h: 2, card }];

    const result = filterCatalogForGrid(catalog, grid);
    expect(result).toHaveLength(0);
  });

  test('should keep catalog items not present in the grid', () => {
    const catalogCard = makeCard({ id: 'card-2', title: 'CTR' });
    const gridCard = makeCard({ id: 'card-1', title: 'Revenue' });
    const catalog = [{ w: 4, h: 2, card: catalogCard }];
    const grid = [{ i: 'grid-1', x: 0, y: 0, w: 4, h: 2, card: gridCard }];

    const result = filterCatalogForGrid(catalog, grid);
    expect(result).toHaveLength(1);
    expect(result[0].card).toBe(catalogCard);
  });

  test('should deduplicate the catalog itself', () => {
    const card = makeCard({ id: 'card-1', title: 'Revenue' });
    const catalog = [
      { w: 4, h: 2, card },
      { w: 4, h: 2, card },
    ];

    const result = filterCatalogForGrid(catalog, []);
    expect(result).toHaveLength(1);
  });

  test('should allow sectionDivider cards through without deduplication', () => {
    const divider: SectionDivider = {
      type: 'sectionDivider',
      title: 'Section',
    };
    const catalog = [
      { w: 12, h: 1, card: divider },
      { w: 12, h: 1, card: divider },
    ];

    const result = filterCatalogForGrid(catalog, []);
    expect(result).toHaveLength(2);
  });

  test('should not mutate its inputs', () => {
    const card = makeCard({ id: 'card-1', title: 'Revenue' });
    const catalog = [{ w: 4, h: 2, card }];
    const grid = [{ i: 'grid-1', x: 0, y: 0, w: 4, h: 2, card }];

    const catalogCopy = [...catalog];
    const gridCopy = [...grid];

    filterCatalogForGrid(catalog, grid);

    expect(catalog).toEqual(catalogCopy);
    expect(grid).toEqual(gridCopy);
  });

  test('should match cards by type:title when no id or metrics', () => {
    const catalogCard = makeCard({ id: '', title: 'Revenue' });
    const gridCard = makeCard({ id: '', title: 'Revenue' });
    const catalog = [{ w: 4, h: 2, card: catalogCard }];
    const grid = [{ i: 'grid-1', x: 0, y: 0, w: 4, h: 2, card: gridCard }];

    const result = filterCatalogForGrid(catalog, grid);
    expect(result).toHaveLength(0);
  });

  test('should handle empty catalog', () => {
    const result = filterCatalogForGrid([], []);
    expect(result).toHaveLength(0);
  });

  test('should handle mixed card types', () => {
    const divider: SectionDivider = {
      type: 'sectionDivider',
      title: 'Section',
    };
    const card1 = makeCard({ id: 'card-1', title: 'Revenue' });
    const card2 = makeCard({ id: 'card-2', title: 'CTR' });

    const catalog = [
      { w: 12, h: 1, card: divider },
      { w: 4, h: 2, card: card1 },
      { w: 4, h: 2, card: card2 },
    ];
    const grid = [{ i: 'grid-1', x: 0, y: 0, w: 4, h: 2, card: card1 }];

    const result = filterCatalogForGrid(catalog, grid);
    // divider passes through, card1 excluded, card2 kept
    expect(result).toHaveLength(2);
    expect(result[0].card).toBe(divider);
    expect(result[1].card).toBe(card2);
  });
});
