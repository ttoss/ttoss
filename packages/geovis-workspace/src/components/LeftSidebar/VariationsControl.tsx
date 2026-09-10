import { Box } from '@ttoss/ui';

import type { GeovisWorkspaceSidebarVariationsFilter } from '../../context/GeovisWorkspaceContext';
import { useGeovisWorkspace } from '../../hooks/useGeovisWorkspace';
import { VariationRow } from './VariationRow';
import { variationRowState } from './variationRowState';

/**
 * A menu of variations rendered inside a filter block: the same rows as the
 * "Variações" tab, driving the same shared selection, but scoped to one block so
 * a tab can stack several menus.
 *
 * The selection is read from the provider rather than lifted into `FiltersTab`
 * the way the timeline and chips are. Those two are lifted because something
 * outside their block needs them — the HUD drives the timeline, the tab badge
 * counts the chips. A menu has no such reader: its value already lives in the
 * shared selection, which is where every consumer looks for it. Keeping it there
 * is also what lets a tab hold any number of menus, since none of them needs a
 * slot of its own above the tab.
 *
 * @param params.control - The control's declaration.
 * @returns The menu's rows.
 *
 * @example
 * <VariationsControl control={{ kind: 'variations', menuId: 'indicator', variations }} />
 */
export const VariationsControl = ({
  control,
}: {
  control: GeovisWorkspaceSidebarVariationsFilter;
}) => {
  const { selection, setSelection, setLeftSidebarOpen, pendingSelection } =
    useGeovisWorkspace();
  const { menuId } = control;

  const selectedValue = selection[menuId] ?? control.defaultValue;

  return (
    <Box
      role="group"
      sx={{
        // Cancels the block's own horizontal padding: the rows carry their own,
        // and their active state is a full-bleed tint with a left border, which
        // reads as a stripe down the block rather than a floating bar only when
        // it reaches the card's edges — the same way it does in the tab.
        marginX: '-16px',
      }}
    >
      {control.variations.map((variation) => {
        const { pending, disabled } = variationRowState({
          pendingSelection,
          menuId,
          value: variation.value,
        });

        return (
          <VariationRow
            key={variation.value}
            variation={variation}
            on={variation.value === selectedValue}
            pending={pending}
            disabled={disabled}
            onSelect={() => {
              setSelection({ menuId, value: variation.value, blocking: true });
              if (control.closeOnSelect) {
                setLeftSidebarOpen({ open: false });
              }
            }}
          />
        );
      })}
    </Box>
  );
};
