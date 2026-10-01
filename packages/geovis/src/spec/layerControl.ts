import type {
  LayerControlEntry,
  LayerControlGroup,
  LayerControlItem,
} from './types';

/**
 * Whether a layer-control entry is a category rather than a toggle — told apart
 * by its `items`, since a toggle carries `layers` instead.
 *
 * @param entry - One of `control.items`.
 * @returns `true` for a {@link LayerControlGroup}.
 *
 * @example
 * isLayerControlGroup({ id: 'saude', label: 'Saúde', items: [] }); // true
 * isLayerControlGroup({ id: 'ubs', label: 'UBS', layers: ['ubs'] }); // false
 */
export const isLayerControlGroup = (
  entry: LayerControlEntry
): entry is LayerControlGroup => {
  return 'items' in entry;
};

/**
 * Every toggle of a layer control, with each category's items in its place —
 * what the on/off state, the trigger's count and the map sync are about.
 *
 * @param entries - `control.items`.
 * @returns The toggles, in order.
 *
 * @example
 * layerControlItems([parques, { id: 'saude', label: 'Saúde', items: [ubs] }]);
 * // [parques, ubs]
 */
export const layerControlItems = (
  entries: readonly LayerControlEntry[]
): LayerControlItem[] => {
  return entries.flatMap((entry) => {
    return isLayerControlGroup(entry) ? entry.items : [entry];
  });
};
