import { useI18n } from '@ttoss/react-i18n';
import { Box, Flex, IconButton, Text } from '@ttoss/ui';
import * as React from 'react';

import type {
  GeovisWorkspaceGroupedMenu,
  GeovisWorkspaceMenuGroup,
} from '../context/GeovisWorkspaceContext';
import { useGeovisWorkspace } from '../hooks/useGeovisWorkspace';
import { findGroupIdForValue, resolveInitialGroupId } from '../menus';
import { messages } from '../messages';
import { MenuButton } from './MenuButton';

/** How far the arrows nudge the tab row, as a fraction of its visible width. */
const TAB_SCROLL_FRACTION = 0.8;

/**
 * The header band sits on the ivory sidebar surface, with a baseline warm
 * enough to read against it — a Kepler-style header. Kept the same tone as the
 * card so the tabs read as part of it rather than a heavier band.
 */
const HEADER_BACKGROUND = '#FAF9F7';
const HEADER_BASELINE = '#D9D0C1';

/**
 * A single group tab in the carousel header. Renders as text only, anchored to
 * the header's baseline: while it is the open group it takes coral text and a
 * thick coral underline overlapping the baseline (Kepler-style); otherwise it
 * is muted with a transparent underline.
 */
const GroupTab = ({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) => {
  return (
    <Box
      as="button"
      {...({ type: 'button' } as object)}
      aria-current={active ? 'true' : undefined}
      onClick={onClick}
      sx={{
        flexShrink: 0,
        border: 'none',
        // The thick underline sits on the header baseline; `-1px` margin pulls
        // it over the 1px baseline so the active line reads as one bar.
        borderBottom: `3px solid ${active ? '#E45946' : 'transparent'}`,
        borderRadius: '0',
        marginBottom: '-1px',
        paddingBlock: '8px',
        paddingInline: '2px',
        backgroundColor: 'transparent',
        cursor: 'pointer',
        fontFamily: 'body',
        fontSize: '13px',
        lineHeight: '1.2',
        fontWeight: active ? 600 : 500,
        whiteSpace: 'nowrap',
        // Coral text on the open group, warm grey when resting.
        color: active ? '#A23228' : '#7A716D',
        transition: 'color 0.15s ease, border-color 0.15s ease',
        '&:hover': {
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

/** A bare coral chevron that nudges the tab row, sitting in the side gutter. */
const ScrollArrow = ({
  side,
  label,
  onClick,
}: {
  side: 'left' | 'right';
  label: string;
  onClick: () => void;
}) => {
  return (
    <IconButton
      icon={side === 'left' ? 'lucide:chevron-left' : 'lucide:chevron-right'}
      aria-label={label}
      onClick={onClick}
      sx={{
        position: 'absolute',
        // Sit in the sidebar's own side gutter, clear of the edge tab's text.
        [side]: '-16px',
        top: 'calc(50% - 1px)',
        transform: 'translateY(-50%)',
        minWidth: 'auto',
        padding: '0',
        color: '#E45946',
        backgroundColor: 'transparent',
        boxShadow: 'none',
        '&:hover': { color: '#A23228', backgroundColor: 'transparent' },
      }}
    />
  );
};

/** Tracks whether the tab row has hidden tabs past either edge. */
const useTabOverflow = ({ groups }: { groups: GeovisWorkspaceMenuGroup[] }) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const [overflow, setOverflow] = React.useState({
    left: false,
    right: false,
  });

  const syncOverflow = React.useCallback(() => {
    const node = scrollRef.current;

    if (!node) {
      return;
    }

    const maxScrollLeft = node.scrollWidth - node.clientWidth;

    setOverflow({
      left: node.scrollLeft > 0,
      right: node.scrollLeft < maxScrollLeft - 1,
    });
  }, []);

  React.useLayoutEffect(() => {
    syncOverflow();

    window.addEventListener('resize', syncOverflow);

    return () => {
      window.removeEventListener('resize', syncOverflow);
    };
    // Re-measure when the groups change, since that changes the scroll width.
  }, [syncOverflow, groups]);

  const scrollByFraction = (fraction: number) => {
    const node = scrollRef.current;

    if (node) {
      node.scrollBy({ left: node.clientWidth * fraction, behavior: 'smooth' });
    }
  };

  return { scrollRef, overflow, syncOverflow, scrollByFraction };
};

interface CarouselHeaderProps {
  /** Optional heading rendered above the tabs. */
  title?: string;
  /** The carousel groups, one tab each. */
  groups: GeovisWorkspaceMenuGroup[];
  /** Id of the currently open group. */
  openGroupId: string;
  /** Called with a group id when its tab is chosen. */
  onSelectGroup: (id: string) => void;
  /** Whether to render the tab row (a lone group needs no tabs). */
  hasTabs: boolean;
}

/** The full-bleed header: an optional title above the scrollable tab row. */
const CarouselHeader = ({
  title,
  groups,
  openGroupId,
  onSelectGroup,
  hasTabs,
}: CarouselHeaderProps) => {
  const {
    intl: { formatMessage },
  } = useI18n();

  const { scrollRef, overflow, syncOverflow, scrollByFraction } =
    useTabOverflow({ groups });

  // Fade only the edges that actually have hidden tabs, matching the arrows.
  const maskImage = `linear-gradient(to right, ${
    overflow.left ? 'transparent' : '#000'
  }, #000 16px, #000 calc(100% - 16px), ${
    overflow.right ? 'transparent' : '#000'
  })`;

  return (
    <Box
      sx={{
        // Full-bleed Kepler-style header: cancel the sidebar card's own padding
        // with negative margins on the same space tokens, then re-add it
        // inside, so the band reaches the card edges.
        marginTop: -5,
        marginX: -4,
        marginBottom: '12px',
        paddingTop: '5',
        paddingX: '4',
        backgroundColor: HEADER_BACKGROUND,
        borderRadius: ['0', '8px 8px 0 0'],
      }}
    >
      {title ? (
        <Text
          sx={{
            fontSize: '11px',
            fontWeight: 700,
            color: '#7A716D',
            textTransform: 'uppercase',
            letterSpacing: '0.09em',
            paddingLeft: '2px',
          }}
        >
          {title}
        </Text>
      ) : null}

      {hasTabs ? (
        <Box
          sx={{
            position: 'relative',
            // Gap below the title, on this block-level Box so it reliably
            // applies.
            marginTop: title ? '20px' : '0',
            // The header baseline the active tab's thick underline sits on.
            borderBottom: `1px solid ${HEADER_BASELINE}`,
          }}
        >
          <Flex
            ref={scrollRef}
            role="group"
            aria-label={title}
            onScroll={syncOverflow}
            sx={{
              gap: '4',
              paddingInline: '2px',
              overflowX: 'auto',
              scrollbarWidth: 'none',
              '::-webkit-scrollbar': { display: 'none' },
              maskImage,
            }}
          >
            {groups.map((group) => {
              return (
                <GroupTab
                  key={group.id}
                  label={group.label}
                  active={group.id === openGroupId}
                  onClick={() => {
                    onSelectGroup(group.id);
                  }}
                />
              );
            })}
          </Flex>

          {overflow.left ? (
            <ScrollArrow
              side="left"
              label={formatMessage(messages.scrollGroupsBackward)}
              onClick={() => {
                scrollByFraction(-TAB_SCROLL_FRACTION);
              }}
            />
          ) : null}

          {overflow.right ? (
            <ScrollArrow
              side="right"
              label={formatMessage(messages.scrollGroupsForward)}
              onClick={() => {
                scrollByFraction(TAB_SCROLL_FRACTION);
              }}
            />
          ) : null}
        </Box>
      ) : null}
    </Box>
  );
};

interface MenuCarouselProps {
  /** The grouped menu whose tabs and open-group items this renders. */
  menu: GeovisWorkspaceGroupedMenu;
}

/**
 * Renders a grouped menu as an underline-tab carousel: a horizontally
 * scrollable header of group tabs at the top of the sidebar with only the open
 * group's items shown below. Selecting an item drives the shared selection
 * (keyed by `menu.id`), while switching tabs only changes which items are
 * visible. The open group follows the selection, so a selected variation is
 * never hidden in a closed group. A single-group menu skips the tabs and
 * renders its items directly.
 */
export const MenuCarousel = ({ menu }: MenuCarouselProps) => {
  const { selection, setSelection } = useGeovisWorkspace();

  const { groups } = menu;
  const selectedValue = selection[menu.id];

  const [openGroupId, setOpenGroupId] = React.useState(() => {
    return resolveInitialGroupId({ menu });
  });

  // Keep the open group in sync with the selection (decision A): when the
  // selection moves to a value in another group — a controlled change or a
  // seeded default — jump to that group so the active item is never hidden.
  // Tracked against the previous selection so browsing to a group with nothing
  // selected (which does not change the selection) leaves the open group put.
  const [previousSelectedValue, setPreviousSelectedValue] =
    React.useState(selectedValue);

  if (selectedValue !== previousSelectedValue) {
    setPreviousSelectedValue(selectedValue);

    const groupForSelection = findGroupIdForValue({
      groups,
      value: selectedValue,
    });

    if (groupForSelection !== undefined && groupForSelection !== openGroupId) {
      setOpenGroupId(groupForSelection);
    }
  }

  if (groups.length === 0) {
    return null;
  }

  const openGroup =
    groups.find((group) => {
      return group.id === openGroupId;
    }) ?? groups[0];

  const hasTabs = groups.length > 1;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      {menu.title || hasTabs ? (
        <CarouselHeader
          title={menu.title}
          groups={groups}
          openGroupId={openGroup.id}
          onSelectGroup={setOpenGroupId}
          hasTabs={hasTabs}
        />
      ) : null}

      <Box role="group" aria-label={openGroup.label}>
        {openGroup.items.map((item) => {
          return (
            <MenuButton
              key={item.value}
              label={item.label}
              active={selectedValue === item.value}
              onClick={() => {
                setSelection({ menuId: menu.id, value: item.value });
              }}
            />
          );
        })}
      </Box>
    </Box>
  );
};
