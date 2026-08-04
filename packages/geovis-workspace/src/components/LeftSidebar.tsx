import { useI18n } from '@ttoss/react-i18n';
import { Box, Flex, IconButton, Text } from '@ttoss/ui';
import type * as React from 'react';

import { useGeovisWorkspace } from '../hooks/useGeovisWorkspace';
import { resolveMenus } from '../menus';
import { messages } from '../messages';
import { MenuButton } from './MenuButton';

/** Default content of the `controls` slot: the config-driven menu groups. */
const DefaultControlsPanel = () => {
  const { config, selection, setSelection } = useGeovisWorkspace();

  const menus = resolveMenus(config);

  return (
    <>
      {menus.map((menu) => {
        return (
          <Box key={menu.id} sx={{ display: 'flex', flexDirection: 'column' }}>
            <Text
              sx={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#7A716D',
                textTransform: 'uppercase',
                letterSpacing: '0.09em',
                marginBottom: '6px',
                paddingLeft: '12px',
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
        // Fills the full-width overlay on mobile; fixed panel on larger screens.
        width: ['100%', '300px'],
        height: '100%',
        flexShrink: 0,
        paddingX: '4',
        paddingTop: '5',
        paddingBottom: '4',
        // Warm ivory surface (cozsolidarias brand) — never cold white.
        backgroundColor: '#FAF9F7',
        // Floating card on larger screens; flush full-screen panel on mobile.
        border: '1px solid #E4DED3',
        borderRadius: [0, '16px'],
        boxShadow: ['none', '0 8px 24px rgba(36, 31, 33, 0.12)'],
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
          color: '#7A716D',
          backgroundColor: 'transparent',
          borderRadius: 'md',
          '&:hover': {
            color: '#A23228',
          },
        }}
      />

      {ControlsOverride ? <ControlsOverride /> : <DefaultControlsPanel />}
    </Flex>
  );
};
