import {
  type CardCatalogItem,
  createGridItemWithPlacement,
  DEFAULT_CARD_CATALOG,
} from 'src/dashboardCardCatalog';

describe('dashboardCardCatalog', () => {
  test('should expose default catalog entries', () => {
    expect(DEFAULT_CARD_CATALOG).toHaveLength(2);
    expect(DEFAULT_CARD_CATALOG[0].card.type).toBe('bigNumber');
    expect(DEFAULT_CARD_CATALOG[1].card.type).toBe('sectionDivider');
  });

  test('should create grid item for regular cards', () => {
    const catalogItem: CardCatalogItem = {
      w: 6,
      h: 3,
      card: {
        title: 'Conversions',
        numberType: 'number',
        type: 'bigNumber',
        sourceType: [{ source: 'api' }],
        data: { api: { total: 10 } },
      },
    };

    const gridItem = createGridItemWithPlacement(catalogItem, 3, 8);

    expect(gridItem.i).toContain('card-');
    expect(gridItem).toMatchObject({
      x: 3,
      y: 8,
      w: 6,
      h: 3,
      isResizable: false,
      card: {
        title: 'Conversions',
        type: 'bigNumber',
      },
    });
  });

  test('should create section divider card with defaults', () => {
    const dividerItem: CardCatalogItem = {
      w: 12,
      h: 1,
      card: {
        type: 'sectionDivider',
      } as never,
    };

    const gridItem = createGridItemWithPlacement(dividerItem, 0, 12);

    expect(gridItem.card).toMatchObject({
      type: 'sectionDivider',
      title: 'New section',
    });
  });
});
