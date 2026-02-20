import type { DashboardGridItem } from './Dashboard';
import type { DashboardCard } from './DashboardCard';
import type { SectionDivider } from './DashboardSectionDivider';

export type DashboardCardType = DashboardCard['type'];

const uniqueId = () => {
  return `card-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

/**
 * Serializable card catalog item (e.g. loaded from API).
 * Used to create new grid items at a given position.
 */
export type CardCatalogItem = Pick<DashboardGridItem, 'w' | 'h' | 'card'>;

const defaultBigNumberCard: DashboardCard = {
  title: 'New metric',
  numberType: 'number',
  type: 'bigNumber',
  sourceType: [{ source: 'api' }],
  data: {},
};

const defaultSectionDivider: SectionDivider = {
  type: 'sectionDivider',
  title: 'New section',
};

export const DEFAULT_CARD_CATALOG: CardCatalogItem[] = [
  {
    w: 4,
    h: 2,
    card: defaultBigNumberCard,
  },
  {
    w: 12,
    h: 1,
    card: defaultSectionDivider,
  },
];

/**
 * Creates a new grid item from a catalog entry at the given (x, y).
 * Uses the last available position when (x, y) is passed from the grid state.
 */
export const createGridItemWithPlacement = (
  catalogItem: CardCatalogItem,
  x: number,
  y: number
): DashboardGridItem => {
  const i = uniqueId();
  const { w, h } = catalogItem;
  const card =
    catalogItem.card.type === 'sectionDivider'
      ? { ...defaultSectionDivider, ...catalogItem.card }
      : ({
          ...catalogItem.card,
          type: catalogItem.card.type,
        } as DashboardCard);
  return {
    i,
    x,
    y,
    w,
    h,
    isResizable: false,
    card: card as DashboardCard | SectionDivider,
  };
};
