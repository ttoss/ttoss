import type { GeoVisSplitSide } from '@ttoss/geovis';
import { defineMessages, useI18n } from '@ttoss/react-i18n';
import { Icon } from '@ttoss/react-icons';
import { Box, Flex } from '@ttoss/ui';

import { useWorkspaceSplit } from '../../split/WorkspaceSplit';
import { FONT_HEAD } from './theme';

const messages = defineMessages({
  editingSide: {
    defaultMessage: 'Editing side',
    description:
      'Split map: the heading of the sidebar block that picks which side of the map the sidebar edits.',
  },
  copyToOther: {
    defaultMessage: 'Copy to {side}',
    description:
      'Split map: button copying the edited side onto the other one. {side} is the other side letter, A or B.',
  },
  copyToOtherTitle: {
    defaultMessage: "Copy side {from}'s settings to side {to}",
    description:
      'Split map: the title and accessible name of the copy button. {from} and {to} are side letters, A or B.',
  },
  swapSides: {
    defaultMessage: 'Swap sides',
    description:
      'Split map: accessible name of the button swapping the settings of sides A and B.',
  },
  swapSidesTitle: {
    defaultMessage: 'Swap the settings of A and B',
    description: 'Split map: the title of the button swapping sides A and B.',
  },
  sideGroup: {
    defaultMessage: 'Map side',
    description:
      'Split map: accessible name of the pair of buttons choosing the side the sidebar edits.',
  },
  side: {
    defaultMessage: 'Map {side}',
    description:
      'Split map: a button choosing the side the sidebar edits. {side} is the side letter, A or B.',
  },
  sideTitle: {
    defaultMessage:
      'Edit map {side}, {position, select, left {left} other {right}} side of the map',
    description:
      'Split map: the title of a side button. {side} is the side letter; {position} is left for A and right for B.',
  },
});

/** The colour that marks each side, as on the map's pills and rings. */
const SIDE_COLOR: Record<GeoVisSplitSide, string> = {
  a: '#0e9e6e',
  b: '#2f6fe4',
};

const INK = '#1a2235';
const MUTED = '#6b7a90';
const SLATE = '#475569';
const GHOST = '#b6c2d1';

const smallButton = {
  display: 'flex',
  alignItems: 'center',
  height: '24px',
  borderRadius: '6px',
  border: '1px solid rgba(0,0,0,0.1)',
  backgroundColor: '#ffffff',
  color: SLATE,
  cursor: 'pointer',
  fontFamily: 'inherit',
  '&:hover': { borderColor: 'rgba(0,0,0,0.22)' },
} as const;

/** A small map glyph with the side's half filled. */
const SideGlyph = ({
  side,
  color,
}: {
  side: GeoVisSplitSide;
  color: string;
}) => {
  return (
    <Box
      as="span"
      sx={{
        flexShrink: 0,
        position: 'relative',
        display: 'flex',
        width: '22px',
        height: '14px',
        borderRadius: '3px',
        border: `1.5px solid ${color}`,
        overflow: 'hidden',
      }}
    >
      <Box
        as="span"
        sx={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: side === 'a' ? 0 : '50%',
          width: '50%',
          backgroundColor: color,
        }}
      />
    </Box>
  );
};

const SideButton = ({
  side,
  active,
  onPick,
}: {
  side: GeoVisSplitSide;
  active: boolean;
  onPick: () => void;
}) => {
  const { intl } = useI18n();
  const color = SIDE_COLOR[side];
  const key = side.toUpperCase();
  return (
    <Box
      as="button"
      {...({
        type: 'button',
        role: 'radio',
        'aria-checked': active,
        title: intl.formatMessage(messages.sideTitle, {
          side: key,
          position: side === 'a' ? 'left' : 'right',
        }),
      } as object)}
      onClick={onPick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        height: '34px',
        padding: '0 10px',
        borderRadius: '8px',
        border: `1px solid ${active ? color : 'rgba(0,0,0,0.1)'}`,
        backgroundColor: active ? `${color}14` : '#ffffff',
        cursor: 'pointer',
        fontFamily: 'inherit',
        textAlign: 'left',
        '&:hover': active ? {} : { borderColor: 'rgba(0,0,0,0.22)' },
      }}
    >
      <SideGlyph side={side} color={active ? color : GHOST} />
      <Box
        as="span"
        sx={{
          flex: 1,
          minWidth: 0,
          fontSize: '12px',
          fontWeight: active ? 600 : 500,
          color: active ? INK : MUTED,
          whiteSpace: 'nowrap',
        }}
      >
        {intl.formatMessage(messages.side, { side: key })}
      </Box>
    </Box>
  );
};

/**
 * The block heading the left sidebar while the map is split: which side the
 * sidebar edits (Mapa A / Mapa B), a copy of that side onto the other, and a
 * swap of the two. Rendered only while split.
 */
export const SplitSideBlock = () => {
  const { isSplit, editing, editSide, copyToOther, swapSides } =
    useWorkspaceSplit();
  const { intl } = useI18n();
  if (!isSplit) return null;

  const from = editing.toUpperCase();
  const to = editing === 'a' ? 'B' : 'A';
  const copyTitle = intl.formatMessage(messages.copyToOtherTitle, { from, to });

  return (
    <Flex
      sx={{
        flexShrink: 0,
        flexDirection: 'column',
        gap: '10px',
        padding: '12px 16px',
        backgroundColor: '#f8fafc',
        borderBottom: '1px solid rgba(0,0,0,0.08)',
      }}
    >
      <Flex
        sx={{
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
        }}
      >
        <Box
          as="span"
          sx={{
            fontFamily: FONT_HEAD,
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: MUTED,
          }}
        >
          {intl.formatMessage(messages.editingSide)}
        </Box>
        <Flex sx={{ gap: '4px' }}>
          <Box
            as="button"
            {...({ type: 'button', title: copyTitle } as object)}
            aria-label={copyTitle}
            onClick={copyToOther}
            sx={{
              ...smallButton,
              gap: '4px',
              padding: '0 7px',
              fontSize: '11px',
              fontWeight: 500,
            }}
          >
            <Icon icon="lucide:copy" style={{ fontSize: '12px' }} />
            {intl.formatMessage(messages.copyToOther, { side: to })}
          </Box>
          <Box
            as="button"
            {...({
              type: 'button',
              title: intl.formatMessage(messages.swapSidesTitle),
            } as object)}
            aria-label={intl.formatMessage(messages.swapSides)}
            onClick={swapSides}
            sx={{
              ...smallButton,
              justifyContent: 'center',
              width: '24px',
              padding: 0,
            }}
          >
            <Icon icon="lucide:arrow-left-right" style={{ fontSize: '12px' }} />
          </Box>
        </Flex>
      </Flex>
      <Box
        role="radiogroup"
        aria-label={intl.formatMessage(messages.sideGroup)}
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: '6px',
        }}
      >
        {(['a', 'b'] as const).map((side) => {
          return (
            <SideButton
              key={side}
              side={side}
              active={editing === side}
              onPick={() => {
                editSide(side);
              }}
            />
          );
        })}
      </Box>
    </Flex>
  );
};
