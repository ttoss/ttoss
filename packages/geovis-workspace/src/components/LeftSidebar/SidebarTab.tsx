import { Icon } from '@ttoss/react-icons';
import { Box, Flex } from '@ttoss/ui';

import { COLOR, FONT_MONO } from './theme';

/** One icon-only tab in the tab bar, with an optional count badge. */
export const SidebarTab = ({
  icon,
  label,
  active,
  badge,
  onClick,
}: {
  icon: string;
  label: string;
  active: boolean;
  badge?: number;
  onClick: () => void;
}) => {
  return (
    <Box
      as="button"
      {...({ type: 'button' } as object)}
      aria-label={label}
      aria-current={active ? 'true' : undefined}
      onClick={onClick}
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
        cursor: 'pointer',
        color: active ? COLOR.textStrong : COLOR.textGhost,
        boxShadow: active ? `inset 0 -3px 0 ${COLOR.textStrong}` : 'none',
        transition: 'color 0.15s ease',
        '&:hover': { color: active ? COLOR.textStrong : COLOR.textMuted },
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
