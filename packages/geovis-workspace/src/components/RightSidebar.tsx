import { GeoVisLegend, useGeoVis } from '@ttoss/geovis';
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

/** Renders every top-level legend the committed spec resolves, in declaration order. */
const RuntimeLegends = () => {
  const { spec } = useGeoVis();

  const legends = spec.legends ?? [];
  if (legends.length === 0) return null;

  return (
    <Flex sx={{ flexDirection: 'column', gap: '2' }}>
      {legends.map((legend) => {
        return (
          <GeoVisLegend key={legend.id} legendId={legend.id} noPositionWrap />
        );
      })}
    </Flex>
  );
};

/**
 * Color legend panel driven by `rightSidebar.legendWithColor`: an optional
 * description, the spec's runtime-resolved legends and a list of data sources.
 * Each block renders only when present.
 */
const LegendWithColorPanel = ({
  description,
  sources,
}: GeovisWorkspaceLegendWithColor) => {
  return (
    <Flex sx={{ flexDirection: 'column', gap: '4' }}>
      {description && (
        <Text sx={{ fontSize: 'sm', color: '#374151', lineHeight: 'base' }}>
          {description}
        </Text>
      )}

      <RuntimeLegends />

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

  const { config, setRightSidebarOpen } = useGeovisWorkspace();

  const legendWithColor = config.rightSidebar?.legendWithColor;

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

      {legendWithColor && <LegendWithColorPanel {...legendWithColor} />}
    </Flex>
  );
};
