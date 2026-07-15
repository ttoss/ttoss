import { GeoVisCanvas, useGeoVis, useGeoVisClick } from '@ttoss/geovis';
import { useI18n } from '@ttoss/react-i18n';
import { Box, Flex, IconButton, Text } from '@ttoss/ui';
import type * as React from 'react';

import type { GeovisWorkspaceSlotName } from '../context/GeovisWorkspaceContext';
import { useGeovisWorkspace } from '../hooks/useGeovisWorkspace';
import { messages } from '../messages';
import { slotHasContent } from '../slots';
import { isColdStart } from '../warnings';
import { IssueList } from './IssueList';
import { LeftSidebar } from './LeftSidebar';
import { RightSidebar } from './RightSidebar';

/** Right-sidebar slots, stacked in this fixed order (ADR-0002). */
const RIGHT_SIDEBAR_SLOTS: GeovisWorkspaceSlotName[] = [
  'legend',
  'warnings',
  'inspector',
  'metadata',
];

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
        zIndex: 2,
        transform: open ? 'translateX(0)' : hiddenTransform,
        opacity: open ? 1 : 0,
        visibility: open ? 'visible' : 'hidden',
        boxShadow: open ? 'lg' : 'none',
        transition:
          'transform 0.25s ease-in-out, opacity 0.2s ease-in-out, visibility 0.25s ease-in-out, box-shadow 0.25s ease-in-out',
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
        top: '4',
        left: '4',
        zIndex: 1,
        color: 'display.text.primary.default',
        backgroundColor: 'display.background.primary.default',
        border: 'sm',
        borderColor: 'display.border.muted.default',
        boxShadow: 'md',
        opacity: isLeftSidebarOpen ? 0 : 1,
        visibility: isLeftSidebarOpen ? 'hidden' : 'visible',
        pointerEvents: isLeftSidebarOpen ? 'none' : 'auto',
        transition: 'opacity 0.2s ease-in-out, visibility 0.2s ease-in-out',
        '&:hover': {
          backgroundColor: 'display.background.secondary.default',
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
export const Layout = () => {
  const { config, isLeftSidebarOpen, isRightSidebarOpen, hasResolvedOnce } =
    useGeovisWorkspace();
  const { spec, result } = useGeoVis();
  const click = useGeoVisClick();

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

  return (
    <Flex
      sx={{
        position: 'relative',
        overflow: 'hidden',
        minHeight: '440px',
        border: 'sm',
        borderColor: 'display.border.muted.default',
        borderRadius: 'lg',
        backgroundColor: 'display.background.primary.default',
      }}
    >
      <Flex sx={{ flex: 1 }}>
        <MapSlot />
      </Flex>

      {hasLeftSidebar && (
        <SidebarOverlay side="left" open={isLeftSidebarOpen}>
          <LeftSidebar />
        </SidebarOverlay>
      )}

      {hasRightSidebar && (
        <SidebarOverlay side="right" open={isRightSidebarOpen}>
          <RightSidebar />
        </SidebarOverlay>
      )}

      {hasLeftSidebar && <OpenLeftSidebarButton />}

      {hasRightSidebar && <OpenRightSidebarButton />}
    </Flex>
  );
};
