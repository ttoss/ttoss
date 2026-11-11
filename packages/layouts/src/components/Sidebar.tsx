import { Drawer } from '@ttoss/components';
import { useI18n } from '@ttoss/react-i18n';
import { Icon } from '@ttoss/react-icons';
import type { BoxProps, ThemeUIStyleObject } from '@ttoss/ui';
import { Box, Flex, IconButton } from '@ttoss/ui';
import * as React from 'react';

import { useIsDesktop } from '../useIsDesktop';
import { useLayout } from './LayoutProvider';
import { sidebarMessages } from './messages';

export const SIDEBAR_WIDTH = '2xs';

/**
 * Offset of each side of the toggle's tap area: on a phone it grows to 44 px
 * (WCAG 2.5.5 and Apple's minimum) when the button is smaller, `100%` being
 * the button's own width or height; from tablet up it is the button itself.
 */
const PHONE_HIT_SLOP = ['min(0px, calc((100% - 44px) / 2))', 0];

/**
 * Sidebar toggle styles. The tap area grows through an invisible
 * pseudo-element, so the header keeps its height.
 */
export const sidebarButtonSx: ThemeUIStyleObject = {
  cursor: 'pointer',
  fontSize: ['xl', '2xl'],
  position: 'relative',
  '::after': {
    content: '""',
    position: 'absolute',
    top: PHONE_HIT_SLOP,
    bottom: PHONE_HIT_SLOP,
    left: PHONE_HIT_SLOP,
    right: PHONE_HIT_SLOP,
  },
};

/**
 * Desktop sidebar styles that depend on whether it is open: closed collapses
 * it to zero size with a fade, open gives it its width, border and padding.
 */
const getDesktopOpenStateSx = (isSidebarOpen: boolean) => {
  if (!isSidebarOpen) {
    return {
      minHeight: '0',
      width: '0',
      minWidth: '0',
      opacity: 0,
      borderRight: 'none',
      paddingX: '0',
      paddingY: '0',
    };
  }

  return {
    minHeight: 'full',
    width: SIDEBAR_WIDTH,
    minWidth: SIDEBAR_WIDTH,
    opacity: 1,
    borderRight: 'sm',
    paddingX: '6',
    paddingY: '6',
  };
};

export const Sidebar = ({
  drawerSlot,
  showSidebarButtonInDrawer,
  children,
  ...boxProps
}: BoxProps & {
  showSidebarButtonInDrawer?: boolean;
  drawerSlot?: React.ReactNode;
}) => {
  const { intl } = useI18n();
  const { isSidebarOpen, toggleSidebar } = useLayout();
  const { isDesktop } = useIsDesktop();

  const sidebarButtonInDrawer = React.useMemo(() => {
    if (!showSidebarButtonInDrawer) {
      return null;
    }

    return (
      <IconButton
        aria-label={intl.formatMessage(
          isSidebarOpen
            ? sidebarMessages.closeSidebar
            : sidebarMessages.openSidebar
        )}
        aria-expanded={isSidebarOpen}
        aria-controls="sidebar"
        sx={sidebarButtonSx}
        data-testid="sidebar-button"
      >
        <Icon icon={isSidebarOpen ? 'sidebar-close' : 'sidebar-open'} />
      </IconButton>
    );
  }, [intl, isSidebarOpen, showSidebarButtonInDrawer]);

  const memoizedDrawerSlot = React.useMemo(() => {
    if (!drawerSlot) {
      return (
        <Flex
          sx={{
            width: 'full',
            paddingY: '3',
            borderBottom: 'sm',
            borderColor: 'display.border.muted.default',
            alignItems: 'center',
          }}
        >
          {sidebarButtonInDrawer}
        </Flex>
      );
    }

    return (
      <Flex
        sx={{
          width: 'full',
          paddingY: '3',
          borderBottom: 'sm',
          borderColor: 'display.border.muted.default',
          alignItems: 'center',
          gap: '2',
        }}
      >
        {sidebarButtonInDrawer}
        <Flex sx={{ minWidth: SIDEBAR_WIDTH, width: SIDEBAR_WIDTH }}>
          {drawerSlot}
        </Flex>
      </Flex>
    );
  }, [drawerSlot, sidebarButtonInDrawer]);

  return (
    <>
      {isDesktop ? (
        <Box
          role="complementary"
          aria-label={intl.formatMessage(sidebarMessages.sidebar)}
          aria-hidden={!isSidebarOpen}
          sx={{
            position: 'relative',
            zIndex: 'overlay',
            height: 'full',
            transition: 'width 0.5s ease, opacity 0.5s ease',
            backgroundColor: 'navigation.background.muted.default',
            overflowY: 'auto',
            ...getDesktopOpenStateSx(isSidebarOpen),
            // After the spread: its `borderRight` shorthand carries no color,
            // so placed earlier it resets this to the text color.
            borderColor: 'display.border.muted.default',
            ...boxProps.sx,
          }}
        >
          {isSidebarOpen ? children : null}
        </Box>
      ) : (
        <Box
          role="complementary"
          aria-label={intl.formatMessage(sidebarMessages.sidebar)}
          aria-hidden={!isSidebarOpen}
          sx={{
            position: 'fixed',
            zIndex: 'overlay',
            border: 'none',
            width: isSidebarOpen ? 'full' : '0',
            height: isSidebarOpen ? 'full' : '0',
            ...boxProps.sx,
          }}
          onClick={() => {
            if (isSidebarOpen) {
              toggleSidebar();
            }
          }}
        >
          <Drawer
            open={isSidebarOpen}
            direction={'left'}
            size={'100%'}
            enableOverlay={false}
          >
            <Flex
              sx={{
                width: 'full',
                height: 'full',
                gap: '6',
                flexDirection: 'column',
              }}
            >
              {memoizedDrawerSlot}
              {isSidebarOpen ? children : null}
            </Flex>
          </Drawer>
        </Box>
      )}
    </>
  );
};

Sidebar.displayName = 'Sidebar';
