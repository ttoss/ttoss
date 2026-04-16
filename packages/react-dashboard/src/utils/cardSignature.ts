import type { DashboardGridItem } from '../Dashboard';
import type { DashboardCard } from '../DashboardCard';
import type { CardCatalogItem } from '../dashboardCardCatalog';
import type { SectionDivider } from '../DashboardSectionDivider';

/**
 * Recursively sorts object keys and array elements to produce a
 * deterministic JSON string regardless of key insertion order.
 */
const stableStringify = (value: unknown): string => {
  if (value === undefined) {
    return 'undefined';
  }
  if (value === null) {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }

  if (typeof value === 'object') {
    const sortedKeys = Object.keys(value as Record<string, unknown>).sort();
    const entries = sortedKeys.map((key) => {
      return `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`;
    });
    return `{${entries.join(',')}}`;
  }

  return JSON.stringify(value);
};

/**
 * Returns a stable string signature for a dashboard card, or `null` for
 * `sectionDivider` cards.
 *
 * Priority: `id` → `metrics`-based signature → `type:title` fallback.
 */
export const getCardSignature = (
  card: DashboardCard | SectionDivider
): string | null => {
  if (card.type === 'sectionDivider') {
    return null;
  }

  const dashboardCard = card as DashboardCard;

  if (dashboardCard.id) {
    return `id:${dashboardCard.id}`;
  }

  if (dashboardCard.metrics && dashboardCard.metrics.length > 0) {
    const metricsKey = stableStringify(dashboardCard.metrics);
    return `metrics:${metricsKey}`;
  }

  return `type:${dashboardCard.type}:${dashboardCard.title}`;
};

/**
 * Filters a card catalog by removing items whose card signature matches a card
 * already present in the grid. Also deduplicates the catalog itself.
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

  return catalog.filter((catalogItem) => {
    const sig = getCardSignature(catalogItem.card);

    // sectionDivider cards (sig === null) are never filtered out
    if (sig === null) {
      return true;
    }

    // Exclude cards already in the grid
    if (gridSignatures.has(sig)) {
      return false;
    }

    // Deduplicate within catalog
    if (seen.has(sig)) {
      return false;
    }

    seen.add(sig);
    return true;
  });
};
