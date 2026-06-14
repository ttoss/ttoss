import { useI18n } from '@ttoss/react-i18n';
import { Box, Flex, IconButton } from '@ttoss/ui';
import type * as React from 'react';

import { useGeovisWorkspace } from '../hooks/useGeovisWorkspace';
import { messages } from '../messages';
import { LeftSidebar } from './LeftSidebar';
import { RightSidebar } from './RightSidebar';

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
      onClick={() => {
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
      onClick={() => {
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

interface LayoutProps {
  children?: React.ReactNode;
}

/**
 * Internal layout shell. The children fill the whole area, and each sidebar
 * (and its floating reopen button) is rendered only when the corresponding
 * section is defined in the spec.
 */
export const Layout = ({ children }: LayoutProps) => {
  const { spec, isLeftSidebarOpen, isRightSidebarOpen } = useGeovisWorkspace();

  const hasLeftSidebar = spec.leftSidebar !== undefined;

  const hasRightSidebar = spec.rightSidebar !== undefined;

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
      <Flex sx={{ flex: 1 }}>{children}</Flex>

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
