import { Box, Text } from '@ttoss/ui';

import type { GeovisWorkspaceSidebarVariation } from '../../context/GeovisWorkspaceContext';
import { IconChip } from './IconChip';
import { COLOR } from './theme';

const ACCENT = COLOR.primary;

/**
 * One selectable variation row: icon chip, label, and an active dot.
 *
 * Shared by the two surfaces a menu can be rendered on — the "Variações" tab
 * and a `variations` filter block — so a menu looks the same whichever one it
 * is declared as, and a change to the row reaches both.
 *
 * @param params.variation - The variation this row selects.
 * @param params.on - Whether it is the menu's current value.
 * @param params.onSelect - Called when the row is pressed.
 * @returns The row.
 *
 * @example
 * <VariationRow variation={{ value: 'renda', label: 'Renda' }} on onSelect={pick} />
 */
export const VariationRow = ({
  variation,
  on,
  onSelect,
}: {
  variation: GeovisWorkspaceSidebarVariation;
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
