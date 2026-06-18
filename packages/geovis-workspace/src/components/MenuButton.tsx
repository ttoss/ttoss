import { Box } from '@ttoss/ui';

interface MenuButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

/**
 * Internal full-width menu item used inside the left sidebar groups.
 * Highlights itself when `active` is true.
 */
export const MenuButton = ({ label, active, onClick }: MenuButtonProps) => {
  return (
    <Box
      as="button"
      type="button"
      aria-pressed={active}
      data-active={active ? '' : undefined}
      onClick={onClick}
      sx={{
        display: 'block',
        width: '100%',
        marginBottom: '2px',
        paddingBlock: '7px',
        paddingInline: '10px',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: 'body',
        fontSize: '14px',
        lineHeight: '1.4',
        letterSpacing: '0.01em',
        fontWeight: active ? 600 : 500,
        color: active ? '#4338ca' : '#374151',
        backgroundColor: active ? '#eef2ff' : 'transparent',
        transition: 'background-color 0.15s ease, color 0.15s ease',
        '&:hover': {
          backgroundColor: active ? '#e0e7ff' : '#f3f4f6',
          color: '#4338ca',
        },
        '&:focus-visible': {
          outline: '2px solid #6366f1',
          outlineOffset: '1px',
        },
      }}
    >
      {label}
    </Box>
  );
};
