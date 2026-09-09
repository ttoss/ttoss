import { Box } from '@ttoss/ui';

import type { GeovisWorkspaceSidebarVariationsBody } from '../../context/GeovisWorkspaceContext';
import { useGeovisWorkspace } from '../../hooks/useGeovisWorkspace';
import { BlockLabel } from './FilterBlockSection';
import { VariationRow } from './VariationRow';
import { variationRowState } from './variationRowState';

/**
 * The flat "Variações" list: every variation across all groups, one per row,
 * with a leading icon chip, its label, and an active dot. Selecting a row drives
 * the shared selection (keyed by `menuId`), recoloring the map. Adapted to the
 * single coral accent — the per-group/per-variation colors from config are not
 * used, and the groups only set the list order.
 *
 * With `body.closeOnSelect`, picking a row also closes the sidebar, so the map
 * it just recolored is visible without a second tap. `body.title` heads the list
 * with a block's label, which is what keeps a menu tab from opening on bare rows
 * when no section declares a `header.title`.
 *
 * This is the whole-tab surface for a single menu. For several menus sharing one
 * tab, declare each as a `variations` control inside a `filters` body instead:
 * the rows are the same, and blocks give every menu its own heading.
 */
export const VariationsTab = ({
  body,
}: {
  body: GeovisWorkspaceSidebarVariationsBody;
}) => {
  const { selection, setSelection, setLeftSidebarOpen, pendingSelection } =
    useGeovisWorkspace();
  const { menuId } = body;

  const selectedValue = selection[menuId] ?? body.defaultValue;

  const variations = body.groups.flatMap((group) => {
    return group.variations;
  });

  return (
    <Box sx={{ paddingY: '8px' }}>
      {/*
        Same label a filter block draws, at the same inset and the same 20px
        from the tab bar, so a menu tab and a filters tab read as one family.
        Omitted when the body declares no `title` — the header band may be
        naming the section already.
      */}
      {body.title ? (
        <Box
          sx={{ paddingX: '16px', paddingTop: '12px', marginBottom: '12px' }}
        >
          <BlockLabel title={body.title} icon={body.icon} />
        </Box>
      ) : null}

      <Box role="group">
        {variations.map((variation) => {
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
                setSelection({
                  menuId,
                  value: variation.value,
                  blocking: true,
                });
                if (body.closeOnSelect) {
                  setLeftSidebarOpen({ open: false });
                }
              }}
            />
          );
        })}
      </Box>
    </Box>
  );
};
