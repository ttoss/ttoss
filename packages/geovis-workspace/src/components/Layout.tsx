import { GeoVisCanvas, useGeoVis, useGeoVisClick } from '@ttoss/geovis';
import { useI18n } from '@ttoss/react-i18n';
import { Box, Flex, IconButton, Text } from '@ttoss/ui';
import type * as React from 'react';

import type {
  GeovisWorkspaceSelection,
  GeovisWorkspaceSidebarSection,
} from '../context/GeovisWorkspaceContext';
import { TimelineContext } from '../context/TimelineContext';
import { useGeovisWorkspace } from '../hooks/useGeovisWorkspace';
import { messages } from '../messages';
import { RIGHT_SIDEBAR_SLOTS, slotHasContent } from '../slots';
import { isColdStart } from '../warnings';
import { IssueList } from './IssueList';
import { LeftSidebar } from './LeftSidebar';
import { COLOR } from './LeftSidebar/theme';
import { isSectionEnabled, useSections } from './LeftSidebar/useSections';
import { useTimeline } from './LeftSidebar/useTimeline';
import { MapFooter } from './MapFooter';
import { RightSidebar } from './RightSidebar';
import { TimelineHud } from './TimelineHud';

/** Default content of the `map` slot: the GeoVis canvas filling the main area. */
const DefaultMapPanel = () => {
  return <GeoVisCanvas style={{ width: '100%', height: '100%' }} />;
};

/**
 * Cold-start empty state: no spec has ever resolved, so there is nothing to
 * show yet in place of an uninitialized canvas (ADR-0003). Once any resolve
 * succeeds, `GeoVisProvider`'s own "nothing renders on failure" contract
 * takes over for later failures — this view only ever covers the first one.
 */
const MapColdStartEmptyState = () => {
  const { result } = useGeoVis();
  const { onRepair } = useGeovisWorkspace();
  const {
    intl: { formatMessage },
  } = useI18n();

  if (result.status === 'resolved') return null;

  return (
    <Flex
      sx={{
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '3',
        width: '100%',
        height: '100%',
        padding: '6',
        overflowY: 'auto',
      }}
    >
      <Text
        sx={{
          fontSize: 'sm',
          fontWeight: 'semibold',
          color: 'display.text.primary.default',
        }}
      >
        {formatMessage(messages.coldStartTitle)}
      </Text>

      <IssueList issues={result.issues} severity="error" onRepair={onRepair} />
    </Flex>
  );
};

/** Resolves and renders the `map` slot's override-or-default content. */
const MapSlot = () => {
  const { config, hasResolvedOnce } = useGeovisWorkspace();
  const { result } = useGeoVis();

  if (config.slots?.map?.hidden === true) return null;

  const MapOverride = config.slots?.map?.component;
  if (MapOverride) return <MapOverride />;

  if (isColdStart({ result, hasResolvedOnce })) {
    return <MapColdStartEmptyState />;
  }

  return <DefaultMapPanel />;
};

/**
 * Slide-in overlay that hosts a sidebar on the given side. The sidebar fills
 * the height and is positioned absolutely so it does not push the children.
 */
const SidebarOverlay = ({
  side,
  open,
  children,
}: {
  side: 'left' | 'right';
  open: boolean;
  children: React.ReactNode;
}) => {
  const hiddenTransform =
    side === 'left' ? 'translateX(-100%)' : 'translateX(100%)';

  return (
    <Box
      aria-hidden={!open}
      sx={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        [side]: 0,
        // Full-width (whole workspace) on mobile; sized to its child on larger
        // screens so the sidebar becomes a full-screen panel on phones.
        width: ['100%', 'auto'],
        // Inset on larger screens so the sidebar floats as a card; flush
        // full-screen on mobile. The sidebar itself carries the drop shadow.
        padding: [0, '3'],
        zIndex: 2,
        transform: open ? 'translateX(0)' : hiddenTransform,
        opacity: open ? 1 : 0,
        visibility: open ? 'visible' : 'hidden',
        transition:
          'transform 0.25s ease-in-out, opacity 0.2s ease-in-out, visibility 0.25s ease-in-out',
      }}
    >
      {children}
    </Box>
  );
};

/**
 * Floating button that opens the left sidebar. Hidden while it is open.
 */
const OpenLeftSidebarButton = () => {
  const {
    intl: { formatMessage },
  } = useI18n();

  const { isLeftSidebarOpen, setLeftSidebarOpen } = useGeovisWorkspace();

  return (
    <IconButton
      icon="lucide:sliders-horizontal"
      aria-label={formatMessage(messages.openMenu)}
      onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
        // Release focus before the button hides itself (aria-hidden), so a
        // focused element is never hidden from assistive technology.
        event.currentTarget.blur();
        setLeftSidebarOpen({ open: true });
      }}
      aria-hidden={isLeftSidebarOpen}
      tabIndex={isLeftSidebarOpen ? -1 : 0}
      sx={{
        position: 'absolute',
        // Matches `SidebarOverlay`'s inset (`padding: [0, '3']`) so the button
        // sits exactly on the sidebar card's top-left corner while it is hidden.
        top: '3',
        left: '3',
        zIndex: 1,
        width: '40px',
        height: '40px',
        minWidth: 'auto',
        // `Icon` renders inline at `1em`, so the button's font size is the
        // icon's size.
        fontSize: '16px',
        borderRadius: '12px',
        color: COLOR.textMuted,
        backgroundColor: COLOR.surface,
        border: `1px solid ${COLOR.border}`,
        boxShadow: '0 4px 16px rgba(0,0,0,0.14)',
        opacity: isLeftSidebarOpen ? 0 : 1,
        visibility: isLeftSidebarOpen ? 'hidden' : 'visible',
        pointerEvents: isLeftSidebarOpen ? 'none' : 'auto',
        transition:
          'color 0.15s ease, opacity 0.2s ease-in-out, visibility 0.2s ease-in-out',
        // The prototype's hover darkens only the icon; the surface stays put.
        '&:hover': {
          color: COLOR.textStrong,
        },
      }}
    />
  );
};

/**
 * Floating button that opens the right sidebar. Sits vertically centered on
 * the right edge and is hidden while the sidebar is open.
 */
const OpenRightSidebarButton = () => {
  const {
    intl: { formatMessage },
  } = useI18n();

  const { isRightSidebarOpen, setRightSidebarOpen } = useGeovisWorkspace();

  return (
    <IconButton
      icon="lucide:chevrons-left"
      aria-label={formatMessage(messages.openDetails)}
      onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
        // Release focus before the button hides itself (aria-hidden), so a
        // focused element is never hidden from assistive technology.
        event.currentTarget.blur();
        setRightSidebarOpen({ open: true });
      }}
      aria-hidden={isRightSidebarOpen}
      tabIndex={isRightSidebarOpen ? -1 : 0}
      sx={{
        position: 'absolute',
        top: '50%',
        right: 0,
        transform: 'translateY(-50%)',
        zIndex: 1,
        borderTopLeftRadius: 'md',
        borderBottomLeftRadius: 'md',
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
        color: 'display.text.primary.default',
        backgroundColor: 'display.background.primary.default',
        border: 'sm',
        borderColor: 'display.border.muted.default',
        boxShadow: 'md',
        opacity: isRightSidebarOpen ? 0 : 1,
        visibility: isRightSidebarOpen ? 'hidden' : 'visible',
        pointerEvents: isRightSidebarOpen ? 'none' : 'auto',
        transition: 'opacity 0.2s ease-in-out, visibility 0.2s ease-in-out',
        '&:hover': {
          backgroundColor: 'display.background.secondary.default',
        },
      }}
    />
  );
};

/**
 * Internal layout shell. Resolves all six slots through one override-or-
 * default path (ADR-0002): `map` fills the main area; `controls` renders in
 * the left sidebar; `legend`, `warnings`, `inspector`, and `metadata` stack
 * in that order in the right sidebar. Each sidebar (and its floating reopen
 * button) is rendered only when at least one of its slots has content to
 * show — an explicit `hidden` always suppresses a slot regardless.
 */
/**
 * The controls that float over the map: the two reopen buttons, the compact
 * timeline bar, and the footer naming the active variation. Grouped out of
 * `Layout` so its body stays about structure rather than about which overlay
 * currently applies.
 */
const MapOverlays = ({
  hasLeftSidebar,
  hasRightSidebar,
  hudVisible,
  showFooter,
  onDismissHud,
}: {
  hasLeftSidebar: boolean;
  hasRightSidebar: boolean;
  hudVisible: boolean;
  showFooter: boolean;
  onDismissHud: () => void;
}) => {
  return (
    <>
      {hasLeftSidebar && <OpenLeftSidebarButton />}

      {hasRightSidebar && <OpenRightSidebarButton />}

      {hudVisible && <TimelineHud onDismiss={onDismissHud} />}

      {/* The footer reads `hudVisible` too: the bar owns the bottom edge while
          it is up, so the footer steps clear of it. */}
      {showFooter && <MapFooter hudVisible={hudVisible} />}
    </>
  );
};

/**
 * Whether the timeline is live. The gate is declared on the section that holds
 * the timeline rather than on the control itself, so it is resolved here and
 * threaded into both the timeline state and the compact HUD. A sidebar with no
 * filters section has no gate to honour.
 */
const resolveTimelineEnabled = ({
  filtersSection,
  sections,
  selection,
}: {
  filtersSection?: GeovisWorkspaceSidebarSection;
  sections: GeovisWorkspaceSidebarSection[];
  selection: GeovisWorkspaceSelection;
}): boolean => {
  if (!filtersSection) {
    return true;
  }

  return isSectionEnabled({ section: filtersSection, sections, selection });
};

export const Layout = () => {
  const {
    config,
    selection,
    isLeftSidebarOpen,
    isRightSidebarOpen,
    hasResolvedOnce,
    isTimelineHudVisible,
    dismissTimelineHud,
  } = useGeovisWorkspace();
  const { spec, result } = useGeoVis();
  const click = useGeoVisClick();

  // The timeline is driven from two sibling surfaces — the sidebar's control and
  // the compact HUD anchored to the map — so its state is held here, their
  // nearest common ancestor. Mounted once: a second `useTimeline` would run a
  // second auto-advance timer against the same selection.
  const sections = config.leftSidebar?.sections ?? [];
  const { timeline, filtersSection } = useSections(sections);

  const isTimelineEnabled = resolveTimelineEnabled({
    filtersSection,
    sections,
    selection,
  });

  const timelineState = useTimeline({
    timeline,
    enabled: isTimelineEnabled,
  });

  const hasLeftSidebar = slotHasContent({
    config,
    spec,
    result,
    hasResolvedOnce,
    click,
    slot: 'controls',
  });

  const hasRightSidebar = RIGHT_SIDEBAR_SLOTS.some((slot) => {
    return slotHasContent({
      config,
      spec,
      result,
      hasResolvedOnce,
      click,
      slot,
    });
  });

  // `'bare'` drops the card chrome so the workspace fills its container
  // edge-to-edge; `'card'` (default) keeps the framed look.
  const isBare = config.appearance === 'bare';

  // Decided by `GeovisWorkspace` (see isTimelineHudVisible): the same flag lifts
  // the map's layer control clear of the bar, and that offset is applied to the
  // spec above this tree. Two conditions are added here — with no sidebar there
  // is no timeline to drive, and a closed gate must take the HUD with it, or it
  // would keep offering the very control the disabled tab just withdrew.
  const hudVisible =
    isTimelineHudVisible && hasLeftSidebar && isTimelineEnabled;

  return (
    <TimelineContext.Provider value={{ ...timelineState, filter: timeline }}>
      <Flex
        sx={{
          position: 'relative',
          overflow: 'hidden',
          minHeight: '440px',
          backgroundColor: 'display.background.primary.default',
          ...(isBare
            ? {}
            : {
                border: 'sm',
                borderColor: 'display.border.muted.default',
                borderRadius: 'lg',
              }),
        }}
      >
        <Flex sx={{ flex: 1 }}>
          <MapSlot />
        </Flex>

        {/* Both overlays stay mounted; visibility is gated through `open`, not by
          conditionally rendering the overlay. Unmounting on `has*Sidebar` would
          remove the node the instant its slots lose content (e.g. the inspector
          clearing on an outside click), skipping the slide-out transition and
          making the sidebar vanish abruptly. Keeping it mounted lets `open` fall
          to `false` and the overlay animate closed. The reopen buttons stay
          gated on content — an empty sidebar has nothing to reopen. */}
        <SidebarOverlay side="left" open={hasLeftSidebar && isLeftSidebarOpen}>
          <LeftSidebar />
        </SidebarOverlay>

        <SidebarOverlay
          side="right"
          open={hasRightSidebar && isRightSidebarOpen}
        >
          <RightSidebar />
        </SidebarOverlay>

        <MapOverlays
          hasLeftSidebar={hasLeftSidebar}
          hasRightSidebar={hasRightSidebar}
          hudVisible={hudVisible}
          showFooter={Boolean(config.footer)}
          onDismissHud={dismissTimelineHud}
        />
      </Flex>
    </TimelineContext.Provider>
  );
};
