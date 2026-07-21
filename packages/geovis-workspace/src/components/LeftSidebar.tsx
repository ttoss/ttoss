import { useI18n } from '@ttoss/react-i18n';
import { Box, Flex, IconButton, Text } from '@ttoss/ui';
import type * as React from 'react';

import { useGeovisWorkspace } from '../hooks/useGeovisWorkspace';
import { messages } from '../messages';
import { MenuButton } from './MenuButton';

/** Default content of the `controls` slot: the config-driven menu groups. */
const DefaultControlsPanel = () => {
  const { config, selection, setSelection } = useGeovisWorkspace();

  const menus = config.controls?.menus ?? [];

  return (
    <>
      {menus.map((menu) => {
        return (
          <Box key={menu.id} sx={{ display: 'flex', flexDirection: 'column' }}>
            <Text
              sx={{
                fontSize: 'xs',
                fontWeight: 'semibold',
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '2',
              }}
            >
              {menu.title}
            </Text>

            {menu.items.map((item) => {
              return (
                <MenuButton
                  key={item.value}
                  label={item.label}
                  active={selection[menu.id] === item.value}
                  onClick={() => {
                    setSelection({ menuId: menu.id, value: item.value });
                  }}
                />
              );
            })}
          </Box>
        );
      })}
    </>
  );
};

/**
 * Internal left sidebar: the chrome hosting the `controls` slot. Rendered
 * only when `Layout` determines that slot has content.
 */
export const LeftSidebar = () => {
  const {
    intl: { formatMessage },
  } = useI18n();

  const { config, setLeftSidebarOpen } = useGeovisWorkspace();

  const ControlsOverride = config.slots?.controls?.component;

  return (
    <Flex
      sx={{
        position: 'relative',
        flexDirection: 'column',
        gap: '5',
        width: '300px',
        height: '100%',
        flexShrink: 0,
        paddingX: '4',
        paddingTop: '5',
        paddingBottom: '4',
        backgroundColor: '#ffffff',
        borderRight: '1px solid #e5e7eb',
        overflowY: 'auto',
      }}
    >
      <IconButton
        icon="lucide:chevron-left"
        aria-label={formatMessage(messages.closeMenu)}
        onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
          // Release focus before the sidebar hides itself (aria-hidden), so a
          // focused element is never hidden from assistive technology.
          event.currentTarget.blur();
          setLeftSidebarOpen({ open: false });
        }}
        sx={{
          position: 'absolute',
          top: '3',
          right: '3',
          color: '#6b7280',
          backgroundColor: 'transparent',
          borderRadius: 'md',
          '&:hover': {
            color: '#4338ca',
          },
        }}
      />

      {ControlsOverride ? <ControlsOverride /> : <DefaultControlsPanel />}
    </Flex>
  );
};
