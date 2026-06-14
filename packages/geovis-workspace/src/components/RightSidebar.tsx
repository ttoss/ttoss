import { useI18n } from '@ttoss/react-i18n';
import { Flex, Heading, IconButton, Text } from '@ttoss/ui';

import { useGeovisWorkspace } from '../hooks/useGeovisWorkspace';
import { messages } from '../messages';

/**
 * Internal right sidebar. Shows the spec-defined title and a summary of the
 * active selection across menu groups. Rendered only when the spec defines
 * a rightSidebar.
 */
export const RightSidebar = () => {
  const {
    intl: { formatMessage },
  } = useI18n();

  const { spec, selection, setRightSidebarOpen } = useGeovisWorkspace();

  const menus = spec.leftSidebar?.menus ?? [];

  const selected = menus
    .map((menu) => {
      const item = menu.items.find((candidate) => {
        return candidate.value === selection[menu.id];
      });

      return item ? { menuId: menu.id, title: menu.title, item } : undefined;
    })
    .filter((entry) => {
      return entry !== undefined;
    });

  return (
    <Flex
      sx={{
        position: 'relative',
        flexDirection: 'column',
        gap: '4',
        width: '256px',
        height: '100%',
        flexShrink: 0,
        paddingX: '4',
        paddingTop: '5',
        paddingBottom: '4',
        backgroundColor: '#ffffff',
        borderLeft: '1px solid #e5e7eb',
        overflowY: 'auto',
      }}
    >
      <IconButton
        icon="lucide:chevron-right"
        aria-label={formatMessage(messages.closeDetails)}
        onClick={() => {
          setRightSidebarOpen({ open: false });
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

      <Heading
        as="h3"
        sx={{
          margin: 0,
          fontSize: 'xs',
          fontWeight: 'semibold',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#6b7280',
        }}
      >
        {spec.rightSidebar?.title ?? formatMessage(messages.detailsTitle)}
      </Heading>

      {selected.length > 0 ? (
        selected.map((entry) => {
          return (
            <Flex
              key={entry.menuId}
              sx={{
                flexDirection: 'column',
                gap: '1',
                paddingX: '3',
                paddingY: '3',
                borderRadius: 'md',
                backgroundColor: '#eef2ff',
                border: '1px solid #e0e7ff',
              }}
            >
              <Text
                sx={{
                  fontSize: 'xs',
                  fontWeight: 'normal',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#6b7280',
                }}
              >
                {entry.title}
              </Text>
              <Text
                sx={{
                  fontSize: 'sm',
                  fontWeight: 'semibold',
                  color: '#4338ca',
                }}
              >
                {entry.item.label}
              </Text>
            </Flex>
          );
        })
      ) : (
        <Text sx={{ fontSize: 'sm', color: '#6b7280' }}>
          {formatMessage(messages.noSelection)}
        </Text>
      )}
    </Flex>
  );
};
