import { isLayerControlGroup, layerControlItems } from '../spec/layerControl';
import type { LayerControlEntry, LayerControlItem } from '../spec/types';
import { resolveItemActive } from './GeoVisLayerControl.items';

/*
 * The layer control's ordering rules, kept pure: which entries the summary
 * strip shows and in what order, how the "Ver mais" panel sections its items,
 * and which item a switch past `maxActiveItems` turns off.
 */

/** Whether an item is on and draws something — some of its layers exist. */
const isItemDrawn = ({
  item,
  activeById,
  layerIds,
}: {
  item: LayerControlItem;
  activeById: Record<string, boolean>;
  layerIds: Set<string>;
}): boolean => {
  return (
    resolveItemActive(item, activeById) &&
    item.layers.some((id) => {
      return layerIds.has(id);
    })
  );
};

/**
 * Whether an entry counts as on: an item when it is and some of its layers
 * exist, a category when any of its items does. An item on by default whose
 * layers the spec lacks draws nothing, so it does not count.
 *
 * @param params.entry - One of `control.items`.
 * @param params.activeById - The remembered on/off choices.
 * @param params.layerIds - Ids of the layers in the current spec.
 * @returns Whether the entry is on.
 */
export const isEntryActive = ({
  entry,
  activeById,
  layerIds,
}: {
  entry: LayerControlEntry;
  activeById: Record<string, boolean>;
  layerIds: Set<string>;
}): boolean => {
  const items = isLayerControlGroup(entry) ? entry.items : [entry];
  return items.some((item) => {
    return isItemDrawn({ item, activeById, layerIds });
  });
};

/**
 * Splits the entries into the summary strip and the rest behind the "Ver
 * mais" card: every entry that is on, in `items` order, then the others in
 * that order up to `maxVisibleItems`. More entries on than places grow the
 * strip rather than hide one. Nothing is hidden when the limit is unset or the
 * list already fits.
 *
 * @param params.items - `control.items`.
 * @param params.maxVisibleItems - The strip's places.
 * @param params.activeById - The choices the order is read from — a snapshot
 *   taken when the panel opened, so nothing moves while it stays open.
 * @param params.layerIds - Ids of the layers in the current spec.
 * @returns The strip's entries and the hidden ones, each in `items` order.
 *
 * @example
 * splitStripEntries({ items: [a, b, c, d], maxVisibleItems: 2, activeById: { d: true }, layerIds });
 * // { visible: [d, a], hidden: [b, c] }
 */
export const splitStripEntries = ({
  items,
  maxVisibleItems,
  activeById,
  layerIds,
}: {
  items: LayerControlEntry[];
  maxVisibleItems: number | undefined;
  activeById: Record<string, boolean>;
  layerIds: Set<string>;
}): { visible: LayerControlEntry[]; hidden: LayerControlEntry[] } => {
  if (maxVisibleItems == null || items.length <= maxVisibleItems) {
    return { visible: items, hidden: [] };
  }
  const on = items.filter((entry) => {
    return isEntryActive({ entry, activeById, layerIds });
  });
  const off = items.filter((entry) => {
    return !on.includes(entry);
  });
  const places = Math.max(0, maxVisibleItems - on.length);
  return {
    visible: [...on, ...off.slice(0, places)],
    hidden: off.slice(places),
  };
};

/** A run of the "Ver mais" panel: its heading, when it has one, and entries. */
export interface EntrySection {
  title?: string;
  entries: LayerControlEntry[];
}

/**
 * The "Ver mais" panel's sections: the entries without a category first, with
 * no heading, then one section per item `category`, in the order each first
 * appears. A group carries no category, so it sits with the first run.
 *
 * @param items - `control.items`.
 * @returns The sections, empty ones left out.
 *
 * @example
 * sectionEntries([parques, { ...ubs, category: 'Saúde' }]);
 * // [{ entries: [parques] }, { title: 'Saúde', entries: [ubs] }]
 */
export const sectionEntries = (items: LayerControlEntry[]): EntrySection[] => {
  const untitled: LayerControlEntry[] = [];
  const titled = new Map<string, LayerControlEntry[]>();
  for (const entry of items) {
    const category = isLayerControlGroup(entry) ? undefined : entry.category;
    if (category === undefined) {
      untitled.push(entry);
      continue;
    }
    if (!titled.has(category)) titled.set(category, []);
    titled.get(category)!.push(entry);
  }
  const sections: EntrySection[] = [...titled].map(([title, entries]) => {
    return { title, entries };
  });
  return untitled.length > 0 ? [{ entries: untitled }, ...sections] : sections;
};

/**
 * The items a switch-on turns off to stay within `maxActiveItems`: those on
 * longest ago — on by default first, in `items` order, then in the order they
 * were switched on — until the newcomer fits. Only items whose layers exist
 * count, since a disabled one draws nothing.
 *
 * @param params.items - `control.items`.
 * @param params.activeById - The remembered on/off choices, before the switch.
 * @param params.switchedOn - Item ids in the order they were switched on.
 * @param params.layerIds - Ids of the layers in the current spec.
 * @param params.incoming - The item being switched on.
 * @param params.maxActiveItems - The limit, if any.
 * @returns The ids to switch off, oldest first; empty when within the limit.
 *
 * @example
 * itemsToSwitchOff({ ..., maxActiveItems: 1 }); // ['hospitais']
 */
export const itemsToSwitchOff = ({
  items,
  activeById,
  switchedOn,
  layerIds,
  incoming,
  maxActiveItems,
}: {
  items: LayerControlEntry[];
  activeById: Record<string, boolean>;
  switchedOn: string[];
  layerIds: Set<string>;
  incoming: LayerControlItem;
  maxActiveItems: number | undefined;
}): string[] => {
  if (maxActiveItems == null) return [];
  const on = layerControlItems(items).filter((item) => {
    return (
      item.id !== incoming.id && isItemDrawn({ item, activeById, layerIds })
    );
  });
  const byDefault = on.filter((item) => {
    return !switchedOn.includes(item.id);
  });
  const bySwitch = switchedOn.flatMap((id) => {
    const item = on.find((candidate) => {
      return candidate.id === id;
    });
    return item ? [item] : [];
  });
  const oldestFirst = [...byDefault, ...bySwitch];
  const excess = oldestFirst.length + 1 - maxActiveItems;
  return excess > 0
    ? oldestFirst.slice(0, excess).map((item) => {
        return item.id;
      })
    : [];
};
