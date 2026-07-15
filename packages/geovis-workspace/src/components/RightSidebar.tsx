import { useI18n } from '@ttoss/react-i18n';
import { Box, Flex, Heading, IconButton, Link, Text } from '@ttoss/ui';
import type * as React from 'react';

import {
  type GeovisWorkspaceLegendWithColor,
  type GeovisWorkspaceSource,
} from '../context/GeovisWorkspaceContext';
import { useGeovisWorkspace } from '../hooks/useGeovisWorkspace';
import { messages } from '../messages';

/** Renders one data-source entry, as an external link when `href` is set. */
const SourceItem = ({ label, href }: GeovisWorkspaceSource) => {
  return (
    <Box as="li" sx={{ fontSize: 'xs', color: '#6b7280', lineHeight: 'base' }}>
      {href ? (
        <Link
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ color: '#4338ca', textDecoration: 'underline' }}
        >
          {label}
        </Link>
      ) : (
        label
      )}
    </Box>
  );
};

/**
 * Color legend panel driven by `rightSidebar.legendWithColor`: an optional
 * description, a swatch-per-class legend and a list of data sources. Each block
 * renders only when present in the spec.
 */
const LegendWithColorPanel = ({
  description,
  legend,
  sources,
}: GeovisWorkspaceLegendWithColor) => {
  return (
    <Flex sx={{ flexDirection: 'column', gap: '4' }}>
      {description && (
        <Text sx={{ fontSize: 'sm', color: '#374151', lineHeight: 'base' }}>
          {description}
        </Text>
      )}

      {legend && (
        <Flex sx={{ flexDirection: 'column', gap: '2' }}>
          {legend.title && (
            <Text
              sx={{
                fontSize: 'xs',
                fontWeight: 'semibold',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#6b7280',
              }}
            >
              {legend.title}
            </Text>
          )}

          <Flex sx={{ flexDirection: 'column', gap: '1' }}>
            {legend.items.map((item) => {
              return (
                <Flex key={item.label} sx={{ alignItems: 'center', gap: '2' }}>
                  <Box
                    sx={{
                      width: '20px',
                      height: '14px',
                      borderRadius: '2px',
                      flexShrink: 0,
                      backgroundColor: item.color,
                    }}
                  />
                  <Text sx={{ fontSize: 'xs', color: '#374151' }}>
                    {item.label}
                  </Text>
                </Flex>
              );
            })}
          </Flex>
        </Flex>
      )}

      {sources && (
        <Box>
          {sources.title && (
            <Text
              sx={{ fontSize: 'sm', fontWeight: 'semibold', color: '#6b7280' }}
            >
              {sources.title}
            </Text>
          )}

          <Box
            as="ul"
            sx={{
              paddingLeft: '4',
              marginTop: '1',
              display: 'flex',
              flexDirection: 'column',
              gap: '1',
            }}
          >
            {sources.items.map((source) => {
              return <SourceItem key={source.label} {...source} />;
            })}
          </Box>
        </Box>
      )}
    </Flex>
  );
};

/**
 * Internal right sidebar. Shows the config-defined title and an optional color
 * legend panel. Rendered only when the config defines a rightSidebar.
 */
export const RightSidebar = () => {
  const {
    intl: { formatMessage },
  } = useI18n();

  const { config, setRightSidebarOpen, details } = useGeovisWorkspace();

  const legendWithColor = config.rightSidebar?.legendWithColor;

  const renderDetails = config.rightSidebar?.renderDetails;

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
        onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
          // Release focus before the sidebar hides itself (aria-hidden), so a
          // focused element is never hidden from assistive technology.
          event.currentTarget.blur();
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
        {config.rightSidebar?.title ?? formatMessage(messages.detailsTitle)}
      </Heading>

      {renderDetails && details && renderDetails(details)}

      {legendWithColor && <LegendWithColorPanel {...legendWithColor} />}
    </Flex>
  );
};
