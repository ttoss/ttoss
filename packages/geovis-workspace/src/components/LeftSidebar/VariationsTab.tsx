import { Box } from '@ttoss/ui';

import type { GeovisWorkspaceSidebarVariationsBody } from '../../context/GeovisWorkspaceContext';
import { useGeovisWorkspace } from '../../hooks/useGeovisWorkspace';
import { VariationRow } from './VariationRow';

/**
 * The flat "Variações" list: every variation across all groups, one per row,
 * with a leading icon chip, its label, and an active dot. Selecting a row drives
 * the shared selection (keyed by `menuId`), recoloring the map. Adapted to the
 * single coral accent — the per-group/per-variation colors from config are not
 * used, and the groups only set the list order.
 *
 * With `body.closeOnSelect`, picking a row also closes the sidebar, so the map
 * it just recolored is visible without a second tap.
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
  const { selection, setSelection, setLeftSidebarOpen } = useGeovisWorkspace();
  const { menuId } = body;

  const selectedValue = selection[menuId] ?? body.defaultValue;

  const variations = body.groups.flatMap((group) => {
    return group.variations;
  });

  return (
    <Box role="group" sx={{ paddingY: '8px' }}>
      {variations.map((variation) => {
        return (
          <VariationRow
            key={variation.value}
            variation={variation}
            on={variation.value === selectedValue}
            onSelect={() => {
              setSelection({ menuId, value: variation.value });
              if (body.closeOnSelect) {
                setLeftSidebarOpen({ open: false });
              }
            }}
          />
        );
      })}
    </Box>
  );
};
