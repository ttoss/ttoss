import { Icon } from '@ttoss/react-icons';
import { Box, Flex } from '@ttoss/ui';

import { COLOR, FONT_MONO } from './theme';

/**
 * The tab's appearance for a given active/disabled pair. Lifted out of the
 * component because resolving it inline puts a ternary on nearly every `sx`
 * entry, which reads as noise and trips the complexity ceiling.
 */
const tabAppearance = ({
  active,
  disabled,
}: {
  active: boolean;
  disabled: boolean;
}) => {
  // A disabled tab never reads as active, however the tab bar has it flagged.
  const isActive = active && !disabled;
  const resting = disabled ? COLOR.textGhost : COLOR.textMuted;

  return {
    isActive,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    color: isActive ? COLOR.textStrong : COLOR.textGhost,
    boxShadow: isActive ? `inset 0 -3px 0 ${COLOR.textStrong}` : 'none',
    hoverColor: isActive ? COLOR.textStrong : resting,
  };
};

/**
 * One icon-only tab in the tab bar, with an optional count badge. A `disabled`
 * tab keeps its slot in the bar — so the layout does not shift as gates open
 * and close — but is dimmed and taken out of the focus order.
 */
export const SidebarTab = ({
  icon,
  label,
  active,
  badge,
  disabled,
  onClick,
}: {
  icon: string;
  label: string;
  active: boolean;
  badge?: number;
  /** Renders the tab inert: no click, no focus, dimmed. */
  disabled: boolean;
  onClick: () => void;
}) => {
  const { isActive, cursor, opacity, color, boxShadow, hoverColor } =
    tabAppearance({ active, disabled });

  return (
    <Box
      as="button"
      {...({ type: 'button', disabled } as object)}
      aria-label={label}
      aria-current={isActive ? 'true' : undefined}
      aria-disabled={disabled ? 'true' : undefined}
      onClick={disabled ? undefined : onClick}
      sx={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '40px',
        height: '40px',
        marginBottom: '-1px',
        border: 'none',
        background: 'transparent',
        cursor,
        opacity,
        color,
        boxShadow,
        transition: 'color 0.15s ease, opacity 0.15s ease',
        '&:hover': { color: hoverColor },
      }}
    >
      <Icon icon={icon} style={{ fontSize: '15px' }} />

      {badge !== undefined && badge > 0 ? (
        <Flex
          sx={{
            position: 'absolute',
            top: '6px',
            right: '6px',
            alignItems: 'center',
            justifyContent: 'center',
            width: '14px',
            height: '14px',
            borderRadius: '9999px',
            backgroundColor: COLOR.chipAccent,
            color: '#ffffff',
            fontFamily: FONT_MONO,
            fontSize: '9px',
            fontWeight: 600,
          }}
        >
          {badge}
        </Flex>
      ) : null}
    </Box>
  );
};
