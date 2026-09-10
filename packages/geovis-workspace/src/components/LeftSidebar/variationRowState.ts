import type { GeovisWorkspacePendingSelection } from '../../context/GeovisWorkspaceContext';

/**
 * How one row renders while a pick is being served.
 *
 * A pure function rather than a hook because both menu surfaces already read
 * the workspace context for their own selection; what they share is the rule,
 * not the subscription — and the rule is what has to stay identical, since a
 * row that dimmed on one surface and not the other would let the user reach
 * through the block form what the tab form forbids.
 *
 * @param params.pendingSelection - The change in flight, if any.
 * @param params.menuId - Menu the row belongs to.
 * @param params.value - The row's variation value.
 * @returns Whether the row is the one being served, and whether it is inert.
 *
 * @example
 * variationRowState({ pendingSelection: { menuId: 'a', value: 'x' }, menuId: 'a', value: 'y' });
 * // { pending: false, disabled: true }
 */
export const variationRowState = ({
  pendingSelection,
  menuId,
  value,
}: {
  pendingSelection?: GeovisWorkspacePendingSelection;
  menuId: string;
  value: string;
}) => {
  const pending =
    pendingSelection?.menuId === menuId && pendingSelection.value === value;

  // Every other row of every other menu waits with it: the point is to stop a
  // second request from being asked for before the first is answered.
  return { pending, disabled: pendingSelection !== undefined && !pending };
};
