import { Icon } from '@ttoss/react-icons';
import { Box, Text } from '@ttoss/ui';

import type { GeovisWorkspaceSidebarVariation } from '../../context/GeovisWorkspaceContext';
import { IconChip } from './IconChip';
import { COLOR } from './theme';

const ACCENT = COLOR.primary;

/**
 * The row's appearance for a given active/pending/disabled triple. Lifted out
 * of the component for the same reason `SidebarTab` lifts its own: resolved
 * inline, it puts a ternary on nearly every `sx` entry and trips the
 * complexity ceiling.
 *
 * The pending row is inert alongside the disabled ones — a second press would
 * ask for what is already on its way — but it keeps full opacity and its active
 * colours, so the wait reads as *this row's*, not as unavailability.
 */
const rowAppearance = ({
  on,
  pending,
  disabled,
}: {
  on: boolean;
  pending: boolean;
  disabled: boolean;
}) => {
  return {
    inert: disabled || pending,
    cursor: disabled || pending ? 'default' : 'pointer',
    opacity: disabled ? 0.45 : 1,
    accent: on ? ACCENT : COLOR.textFaint,
    chipBackground: on ? `${ACCENT}1a` : COLOR.fillAlt,
    labelColor: on ? COLOR.textStrong : COLOR.textMuted,
    labelWeight: on ? 500 : 400,
    state: on
      ? {
          borderLeft: `3px solid ${ACCENT}`,
          backgroundColor: COLOR.primaryTint,
          '&:hover': { backgroundColor: COLOR.primaryTint },
        }
      : {
          borderLeft: '3px solid transparent',
          backgroundColor: 'transparent',
          '&:hover': { backgroundColor: COLOR.fill },
        },
  };
};

/** The trailing spinner marking the row whose request is in flight. */
const PendingMark = () => {
  return (
    <Box
      sx={{
        flexShrink: 0,
        display: 'flex',
        color: ACCENT,
        '@keyframes geovisWorkspaceSpin': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        animation: 'geovisWorkspaceSpin 0.7s linear infinite',
      }}
    >
      <Icon icon="lucide:loader-circle" style={{ fontSize: '12px' }} />
    </Box>
  );
};

/** The trailing dot marking the row that is the menu's current value. */
const ActiveMark = () => {
  return (
    <Box
      sx={{
        flexShrink: 0,
        width: '6px',
        height: '6px',
        borderRadius: '9999px',
        backgroundColor: ACCENT,
      }}
    />
  );
};

/**
 * One selectable variation row: icon chip, label, and an active dot.
 *
 * Shared by the two surfaces a menu can be rendered on — the "Variações" tab
 * and a `variations` filter block — so a menu looks the same whichever one it
 * is declared as, and a change to the row reaches both.
 *
 * @param params.variation - The variation this row selects. Its `description`,
 * when set, becomes the row's hover tooltip.
 * @param params.on - Whether it is the menu's current value.
 * @param params.pending - Whether this row is the pick being served: it keeps
 * the active look and trades its dot for a spinner, so the wait is attributed
 * to the row that caused it.
 * @param params.disabled - Whether the row is inert while some pick is served.
 * @param params.onSelect - Called when the row is pressed.
 * @returns The row.
 *
 * @example
 * <VariationRow variation={{ value: 'renda', label: 'Renda' }} on onSelect={pick} />
 */
export const VariationRow = ({
  variation,
  on,
  pending,
  disabled,
  onSelect,
}: {
  variation: GeovisWorkspaceSidebarVariation;
  on: boolean;
  pending: boolean;
  disabled: boolean;
  onSelect: () => void;
}) => {
  const appearance = rowAppearance({ on, pending, disabled });

  return (
    <Box
      as="button"
      {...({ type: 'button', disabled: appearance.inert } as object)}
      aria-disabled={appearance.inert ? 'true' : undefined}
      /*
       * Undefined when the variation carries no `description`, which is what
       * keeps the attribute off the element entirely — React drops it — rather
       * than arming an empty tooltip on every row.
       */
      title={variation.description}
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
        cursor: appearance.cursor,
        opacity: appearance.opacity,
        transition: 'background-color 0.15s ease, opacity 0.15s ease',
        ...appearance.state,
      }}
    >
      <IconChip
        icon={variation.icon ?? 'lucide:circle'}
        color={appearance.accent}
        background={appearance.chipBackground}
        size={28}
        iconSize={13}
      />

      <Text
        sx={{
          flex: 1,
          minWidth: 0,
          fontSize: '13px',
          fontWeight: appearance.labelWeight,
          lineHeight: 1.3,
          color: appearance.labelColor,
        }}
      >
        {variation.label}
      </Text>

      {pending ? <PendingMark /> : null}
      {!pending && on ? <ActiveMark /> : null}
    </Box>
  );
};
