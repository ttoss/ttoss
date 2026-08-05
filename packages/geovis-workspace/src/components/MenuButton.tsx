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
      // `Box`'s types aren't polymorphic over `as`, so the intrinsic
      // `<button>` `type` attribute isn't in `BoxProps`. Spread it via an
      // `object`-typed cast so it reaches the DOM button at runtime without
      // TS validating the (unknown-to-`Box`) key.
      {...({ type: 'button' } as object)}
      aria-pressed={active}
      data-active={active ? '' : undefined}
      onClick={onClick}
      sx={{
        position: 'relative',
        display: 'block',
        width: '100%',
        marginBottom: '2px',
        paddingBlock: '8px',
        paddingInline: '12px',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: 'body',
        fontSize: '14px',
        lineHeight: '1.4',
        letterSpacing: '0.01em',
        fontWeight: active ? 600 : 500,
        // Keep every item on a single line — bolding the active item never
        // re-wraps and shifts the layout; overflow is truncated with an
        // ellipsis (rendered bold on the active item).
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        // Warm charcoal text; coral for the active item (cozsolidarias brand).
        color: active ? '#A23228' : '#524945',
        // Soft coral tint behind the active item — a tinted-accent background
        // the flat theme palette can't express.
        backgroundColor: active ? '#FEF2F1' : 'transparent',
        transition:
          'background-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease',
        // Coral accent bar anchoring the active item on the left edge.
        '::before': {
          content: '""',
          position: 'absolute',
          left: '4px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '3px',
          height: active ? '58%' : '0%',
          borderRadius: '9999px',
          backgroundColor: '#E45946',
          transition: 'height 0.18s ease',
        },
        '&:hover': {
          backgroundColor: active ? '#FCD9D5' : '#EBE7DF',
          color: active ? '#A23228' : '#241F21',
        },
        '&:focus-visible': {
          outline: '2px solid #ED6D5F',
          outlineOffset: '1px',
        },
      }}
    >
      {label}
    </Box>
  );
};
