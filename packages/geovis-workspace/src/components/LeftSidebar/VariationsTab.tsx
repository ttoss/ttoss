import { Box, Text } from '@ttoss/ui';

import type { GeovisWorkspaceSidebarVariationsBody } from '../../context/GeovisWorkspaceContext';
import { useGeovisWorkspace } from '../../hooks/useGeovisWorkspace';
import { IconChip } from './IconChip';
import { COLOR } from './theme';

type Variation =
  GeovisWorkspaceSidebarVariationsBody['groups'][number]['variations'][number];

const ACCENT = COLOR.primary;

/** One selectable variation row: icon chip, label, and an active dot. */
const VariationRow = ({
  variation,
  on,
  onSelect,
}: {
  variation: Variation;
  on: boolean;
  onSelect: () => void;
}) => {
  const rowSx = on
    ? {
        borderLeft: `3px solid ${ACCENT}`,
        backgroundColor: COLOR.primaryTint,
        '&:hover': { backgroundColor: COLOR.primaryTint },
      }
    : {
        borderLeft: '3px solid transparent',
        backgroundColor: 'transparent',
        '&:hover': { backgroundColor: COLOR.fill },
      };

  return (
    <Box
      as="button"
      {...({ type: 'button' } as object)}
      aria-pressed={on}
      onClick={onSelect}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        width: '100%',
        paddingX: '16px',
        paddingY: '10px',
        textAlign: 'left',
        border: 'none',
        cursor: 'pointer',
        transition: 'background-color 0.15s ease',
        ...rowSx,
      }}
    >
      <IconChip
        icon={variation.icon ?? 'lucide:circle'}
        color={on ? ACCENT : COLOR.textFaint}
        background={on ? `${ACCENT}1a` : COLOR.fillAlt}
        size={28}
        iconSize={13}
      />

      <Text
        sx={{
          flex: 1,
          minWidth: 0,
          fontSize: '13px',
          fontWeight: on ? 500 : 400,
          lineHeight: 1.3,
          color: on ? COLOR.textStrong : COLOR.textMuted,
        }}
      >
        {variation.label}
      </Text>

      {on ? (
        <Box
          sx={{
            flexShrink: 0,
            width: '6px',
            height: '6px',
            borderRadius: '9999px',
            backgroundColor: ACCENT,
          }}
        />
      ) : null}
    </Box>
  );
};

/**
 * The flat "Variações" list: every variation across all groups, one per row,
 * with a leading icon chip, its label, and an active dot. Selecting a row drives
 * the shared selection (keyed by `menuId`), recoloring the map. Adapted to the
 * single coral accent — the per-group/per-variation colors from config are not
 * used, and the groups only set the list order.
 *
 * With `body.closeOnSelect`, picking a row also closes the sidebar, so the map
 * it just recolored is visible without a second tap.
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
