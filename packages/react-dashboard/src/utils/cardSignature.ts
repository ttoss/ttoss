import type { DashboardGridItem } from '../Dashboard';
import type { DashboardCard } from '../DashboardCard';
import type { CardCatalogItem } from '../dashboardCardCatalog';
import type { SectionDivider } from '../DashboardSectionDivider';

/**
 * Returns a stable signature for a card, useful for deduplication.
 *
 * - Returns `null` for `sectionDivider` cards.
 * - Prefers the card `id`, then a `metrics`-based signature, then falls back to `type:title`.
 */
export const getCardSignature = (
  card: DashboardCard | SectionDivider
): string | null => {
  if (card.type === 'sectionDivider') {
    return null;
  }

  const dashboardCard = card as DashboardCard;

  if (dashboardCard.id) {
    return dashboardCard.id;
  }

  if (dashboardCard.metrics && dashboardCard.metrics.length > 0) {
    return `metrics:${JSON.stringify(dashboardCard.metrics)}`;
  }

  return `${dashboardCard.type}:${dashboardCard.title}`;
};

/**
 * Filters a card catalog by removing items whose card signature already
 * exists in the given grid. Also deduplicates the catalog itself.
 *
 * Does **not** mutate its inputs.
 */
export const filterCatalogForGrid = (
  catalog: CardCatalogItem[],
  grid: DashboardGridItem[]
): CardCatalogItem[] => {
  const gridSignatures = new Set(
    grid
      .map((item) => {
        return getCardSignature(item.card);
      })
      .filter((sig): sig is string => {
        return sig !== null;
      })
  );

  const seen = new Set<string | null>();

  return catalog.filter((item) => {
    const sig = getCardSignature(item.card);

    // sectionDivider cards (sig === null) always pass through without deduplication
    if (sig === null) {
      return true;
    }

    // Exclude if already in the grid
    if (gridSignatures.has(sig)) {
      return false;
    }

    // Deduplicate catalog itself
    if (seen.has(sig)) {
      return false;
    }

    seen.add(sig);
    return true;
  });
};
